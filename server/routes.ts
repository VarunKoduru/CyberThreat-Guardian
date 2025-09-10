import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { createScan, updateScan, getScan, getScanHistory } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import multer from "multer";
import axios from "axios";
import crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { ZodError } from "zod";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { URL } from "url";

// Load environment variables in routes.ts
dotenv.config();

const VIRUS_TOTAL_API_KEY = process.env.VIRUS_TOTAL_API_KEY || "ac2acc0b4ce5194695904b0cdfdafb40c98da649457caf33b54b9b4e3abc4eed";
const VIRUS_TOTAL_API_URL = "https://www.virustotal.com/api/v3";

// Log environment variables for debugging
console.log("EMAIL_USER in routes.ts:", process.env.EMAIL_USER);
console.log("EMAIL_PASS in routes.ts:", process.env.EMAIL_PASS);

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("Missing EMAIL_USER or EMAIL_PASS environment variables. Email sending will not work.");
}

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the transporter setup
transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter verification failed:", error);
  } else {
    console.log("Transporter is ready to send emails");
  }
});

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(process.cwd(), "temp-uploads");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileExt = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${fileExt}`);
    },
  }),
  limits: {
    fileSize: 26 * 1024 * 1024, // 26MB max file size (VirusTotal limit is 32MB)
  },
});

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to preprocess URLs (shorten by removing non-essential parts)
const preprocessUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);

    // List of query parameters to remove (tracking, session, etc.)
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'sessionId', 'session_id', 'sid', 'ref', 'referrer', 'aff', 'affiliate',
      'clk', 'clickid', 'click_id', 'gclid', 'fbclid', 'msclkid'
    ];

    // Remove non-essential query parameters
    const searchParams = parsedUrl.searchParams;
    paramsToRemove.forEach(param => {
      searchParams.delete(param);
    });

    // Remove fragment
    parsedUrl.hash = '';

    // Reconstruct the URL
    let processedUrl = parsedUrl.toString();

    // If the URL is still too long, remove all query parameters
    if (processedUrl.length > 2000) {
      parsedUrl.search = '';
      processedUrl = parsedUrl.toString();
    }

    // Final check: if still too long, throw an error
    if (processedUrl.length > 2000) {
      throw new Error("URL is too long even after preprocessing (max 2000 characters)");
    }

    return processedUrl;
  } catch (error) {
    console.error("Error preprocessing URL:", error.message);
    throw new Error("Invalid URL format or too long to process");
  }
};

// Helper function to handle errors
const handleError = (err: any, res: Response) => {
  console.error("API Error:", err);

  if (err instanceof ZodError) {
    return res.status(400).json({ 
      message: "Validation error", 
      errors: err.errors 
    });
  }

  if (axios.isAxiosError(err)) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || err.message || "API request failed";
    return res.status(status).json({ message });
  }

  return res.status(500).json({ 
    message: err.message || "Internal server error" 
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "healthy" });
  });

  // Signup endpoint
  app.post("/api/signup", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      const existingUser = await db
        .select()
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, email)))
        .limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ 
          message: existingUser[0].username === username 
            ? "Username already exists" 
            : "Email already exists" 
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await db.insert(users).values({ username, email, password: hashedPassword }).execute();

      const newUser = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      res.status(201).json({ 
        message: "User created successfully", 
        user: { 
          id: newUser[0].id, 
          username: newUser[0].username, 
          email: newUser[0].email 
        } 
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Login endpoint
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .where(eq(users.email, email))
        .limit(1);
      if (user.length === 0) {
        return res.status(401).json({ message: "Invalid username or email" });
      }

      const passwordMatch = await bcrypt.compare(password, user[0].password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }

      res.status(200).json({ 
        message: "Login successful", 
        user: { 
          id: user[0].id, 
          username: user[0].username, 
          email: user[0].email 
        } 
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Forgot Password endpoint
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      console.log("Forgot password request received for email:", email);

      if (!email) {
        console.log("Email not provided");
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (user.length === 0) {
        console.log("User not found for email:", email);
        return res.status(404).json({ message: "User with this email not found" });
      }

      console.log("User found:", user[0].email);

      // Generate a reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

      console.log("Generated reset token:", resetToken);
      console.log("Token expires at:", resetTokenExpires);

      // Save the token and expiration in the database
      await db
        .update(users)
        .set({ resetToken, resetTokenExpires })
        .where(eq(users.email, email));

      console.log("Updated user with reset token in database");

      // Send the reset email
      const resetLink = `http://localhost:5000/reset-password?token=${resetToken}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Request",
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Cyberthreat Guardian account.</p>
          <p>Click the link below to reset your password (valid for 1 hour):</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      };

      console.log("Sending email with options:", mailOptions);

      const info = await transporter.sendMail(mailOptions);
      console.log("Password reset email sent successfully:", info.messageId);

      res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
      console.error("Error in forgot-password endpoint:", error);
      handleError(error, res);
    }
  });

  // Reset Password endpoint
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, token))
        .limit(1);

      if (user.length === 0) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const currentTime = new Date();
      if (!user[0].resetTokenExpires || currentTime > user[0].resetTokenExpires) {
        return res.status(400).json({ message: "Token has expired" });
      }

      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update the user's password越大 clear the reset token
      await db
        .update(users)
        .set({ 
          password: hashedPassword, 
          resetToken: null, 
          resetTokenExpires: null 
        })
        .where(eq(users.resetToken, token));

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      handleError(error, res);
    }
  });

  // URL Scan endpoint
  app.post("/api/scan/url", async (req: Request, res: Response) => {
    try {
      const { url, userId } = req.body;
      
      if (!url || !userId) {
        return res.status(400).json({ message: "URL and userId are required" });
      }

      // Preprocess the URL to handle long URLs
      const originalUrl = url;
      const processedUrl = preprocessUrl(originalUrl);
      console.log("Original URL:", originalUrl);
      console.log("Processed URL for scanning:", processedUrl);
      
      const newScan = await createScan({
        userId: parseInt(userId),
        scanType: "url",
        resource: originalUrl, // Store the original URL
        status: "pending",
        result: null,
      });
      
      try {
        const urlHash = crypto.createHash('sha256').update(processedUrl).digest('hex');
        
        const response = await axios.get(`${VIRUS_TOTAL_API_URL}/urls/${urlHash}`, {
          headers: {
            "x-apikey": VIRUS_TOTAL_API_KEY
          }
        });
        
        const result = response.data;
        console.log("VirusTotal Raw Response for URL (Success):", JSON.stringify(result, null, 2));
        let status = "clean";
        
        if (result.data?.attributes?.last_analysis_stats) {
          const stats = result.data.attributes.last_analysis_stats;
          
          const statsValues = Object.values(stats) as number[];
          const totalVendors = statsValues.reduce((acc: number, val: number) => acc + val, 0);
          const maliciousRatio = stats.malicious / totalVendors;
          const suspiciousRatio = stats.suspicious / totalVendors;
          
          if (stats.malicious > 3 || maliciousRatio > 0.1) {
            status = "malicious";
          } else if (stats.malicious > 0 || stats.suspicious > 0 || suspiciousRatio > 0.1) {
            status = "suspicious";
          }

          // Extract vendor-specific findings (up to 5 vendors that flagged as malicious or suspicious)
          const lastAnalysisResults = result.data.attributes.last_analysis_results || {};
          const flaggedVendors = Object.entries(lastAnalysisResults)
            .filter(([_, result]: [string, any]) => 
              result.category === "malicious" || result.category === "suspicious"
            )
            .slice(0, 5)
            .map(([vendor, result]: [string, any]) => ({
              vendor,
              category: result.category,
              result: result.result || "N/A"
            }));

          // Extract categories, last analysis date, and times submitted
          const categories = result.data.attributes.categories 
            ? Object.values(result.data.attributes.categories).join(", ")
            : "N/A";
          const lastAnalysisDate = result.data.attributes.last_analysis_date
            ? new Date(result.data.attributes.last_analysis_date * 1000).toLocaleString()
            : "N/A";
          const timesSubmitted = result.data.attributes.times_submitted || 0;

          result.securityAnalysis = {
            totalEngines: totalVendors,
            maliciousCount: stats.malicious,
            suspiciousCount: stats.suspicious,
            cleanCount: stats.undetected,
            maliciousRatio,
            suspiciousRatio,
            summary: stats.malicious > 0 
              ? `Detected as dangerous by ${stats.malicious} security vendors` 
              : (stats.suspicious > 0 
                ? `Flagged as suspicious by ${stats.suspicious} security vendors` 
                : `Clean. No threats detected by security vendors`),
            flaggedVendors,
            categories,
            lastAnalysisDate,
            timesSubmitted
          };

          console.log("Constructed Security Analysis for URL:", result.securityAnalysis);
        }
        
        const updatedScan = await updateScan(newScan.id, {
          status,
          result: JSON.stringify(result),
        });
        
        return res.json(updatedScan);
      } catch (error) {
        console.log("Initial VirusTotal GET failed, submitting URL for scanning:", error.message);
        const formData = new URLSearchParams();
        formData.append('url', processedUrl); // Use the processed URL for submission
        
        const submitResponse = await axios.post(`${VIRUS_TOTAL_API_URL}/urls`, formData, {
          headers: {
            'x-apikey': VIRUS_TOTAL_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        const submitResult = submitResponse.data;
        console.log("VirusTotal Submission Response (Pending):", JSON.stringify(submitResult, null, 2));
        
        // Extract the analysis ID
        const analysisId = submitResult.data?.id;
        if (!analysisId) {
          throw new Error("Failed to get analysis ID from VirusTotal submission response");
        }

        // Poll VirusTotal for the analysis result
        let analysisResult;
        const maxAttempts = 10; // Try for up to 50 seconds (10 attempts x 5 seconds)
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          console.log(`Polling VirusTotal (Attempt ${attempt}/${maxAttempts}) for analysis ID: ${analysisId}`);
          const analysisResponse = await axios.get(`${VIRUS_TOTAL_API_URL}/analyses/${analysisId}`, {
            headers: {
              'x-apikey': VIRUS_TOTAL_API_KEY,
            }
          });
          
          analysisResult = analysisResponse.data;
          console.log(`Analysis Result (Attempt ${attempt}):`, JSON.stringify(analysisResult, null, 2));
          
          if (analysisResult.data.attributes.status === "completed") {
            break;
          }
          
          await delay(5000); // Wait 5 seconds before the next attempt
        }

        // If the analysis is still not complete, return the pending scan
        if (analysisResult.data.attributes.status !== "completed") {
          await updateScan(newScan.id, {
            result: JSON.stringify(submitResult),
          });
          
          return res.json({
            ...newScan,
            message: "URL submitted for scanning, analysis still pending after polling",
          });
        }

        // Once the analysis is complete, fetch the full URL report
        const urlHash = crypto.createHash('sha256').update(processedUrl).digest('hex');
        const finalResponse = await axios.get(`${VIRUS_TOTAL_API_URL}/urls/${urlHash}`, {
          headers: {
            "x-apikey": VIRUS_TOTAL_API_KEY
          }
        });
        
        const finalResult = finalResponse.data;
        console.log("Final VirusTotal Response for URL after polling:", JSON.stringify(finalResult, null, 2));
        let status = "clean";
        
        if (finalResult.data?.attributes?.last_analysis_stats) {
          const stats = finalResult.data.attributes.last_analysis_stats;
          
          const statsValues = Object.values(stats) as number[];
          const totalVendors = statsValues.reduce((acc: number, val: number) => acc + val, 0);
          const maliciousRatio = stats.malicious / totalVendors;
          const suspiciousRatio = stats.suspicious / totalVendors;
          
          if (stats.malicious > 3 || maliciousRatio > 0.1) {
            status = "malicious";
          } else if (stats.malicious > 0 || stats.suspicious > 0 || suspiciousRatio > 0.1) {
            status = "suspicious";
          }

          // Extract vendor-specific findings (up to 5 vendors that flagged as malicious or suspicious)
          const lastAnalysisResults = finalResult.data.attributes.last_analysis_results || {};
          const flaggedVendors = Object.entries(lastAnalysisResults)
            .filter(([_, result]: [string, any]) => 
              result.category === "malicious" || result.category === "suspicious"
            )
            .slice(0, 5)
            .map(([vendor, result]: [string, any]) => ({
              vendor,
              category: result.category,
              result: result.result || "N/A"
            }));

          // Extract categories, last analysis date, and times submitted
          const categories = finalResult.data.attributes.categories 
            ? Object.values(finalResult.data.attributes.categories).join(", ")
            : "N/A";
          const lastAnalysisDate = finalResult.data.attributes.last_analysis_date
            ? new Date(finalResult.data.attributes.last_analysis_date * 1000).toLocaleString()
            : "N/A";
          const timesSubmitted = finalResult.data.attributes.times_submitted || 0;

          finalResult.securityAnalysis = {
            totalEngines: totalVendors,
            maliciousCount: stats.malicious,
            suspiciousCount: stats.suspicious,
            cleanCount: stats.undetected,
            maliciousRatio,
            suspiciousRatio,
            summary: stats.malicious > 0 
              ? `Detected as dangerous by ${stats.malicious} security vendors` 
              : (stats.suspicious > 0 
                ? `Flagged as suspicious by ${stats.suspicious} security vendors` 
                : `Clean. No threats detected by security vendors`),
            flaggedVendors,
            categories,
            lastAnalysisDate,
            timesSubmitted
          };

          console.log("Final Constructed Security Analysis for URL:", finalResult.securityAnalysis);
        }
        
        const updatedScan = await updateScan(newScan.id, {
          status,
          result: JSON.stringify(finalResult),
        });
        
        return res.json(updatedScan);
      }
    } catch (err) {
      handleError(err, res);
    }
  });

  // File Scan endpoint
  app.post("/api/scan/file", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const filePath = req.file.path;
      const fileName = req.file.originalname;
      
      const newScan = await createScan({
        userId: parseInt(userId),
        scanType: "file",
        resource: fileName,
        status: "pending",
        result: null,
      });
      
      try {
        const fileData = fs.readFileSync(filePath);
        
        const fileHash = crypto.createHash('sha256').update(fileData).digest('hex');
        
        try {
          const response = await axios.get(`${VIRUS_TOTAL_API_URL}/files/${fileHash}`, {
            headers: {
              "x-apikey": VIRUS_TOTAL_API_KEY
            }
          });
          
          const result = response.data;
          console.log("VirusTotal Raw Response for File:", JSON.stringify(result, null, 2));
          let status = "clean";
          
          if (result.data?.attributes?.last_analysis_stats) {
            const stats = result.data.attributes.last_analysis_stats;
            
            const statsValues = Object.values(stats) as number[];
            const totalVendors = statsValues.reduce((acc: number, val: number) => acc + val, 0);
            const maliciousRatio = stats.malicious / totalVendors;
            const suspiciousRatio = stats.suspicious / totalVendors;
            
            if (stats.malicious > 3 || maliciousRatio > 0.1) {
              status = "malicious";
            } else if (stats.malicious > 0 || stats.suspicious > 0 || suspiciousRatio > 0.1) {
              status = "suspicious";
            }

            // Extract vendor-specific findings (up to 5 vendors that flagged as malicious or suspicious)
            const lastAnalysisResults = result.data.attributes.last_analysis_results || {};
            const flaggedVendors = Object.entries(lastAnalysisResults)
              .filter(([_, result]: [string, any]) => 
                result.category === "malicious" || result.category === "suspicious"
              )
              .slice(0, 5)
              .map(([vendor, result]: [string, any]) => ({
                vendor,
                category: result.category,
                result: result.result || "N/A"
              }));

            // Extract categories, last analysis date, and times submitted
            const categories = result.data.attributes.names 
              ? result.data.attributes.names.join(", ")
              : "N/A";
            const lastAnalysisDate = result.data.attributes.last_analysis_date
              ? new Date(result.data.attributes.last_analysis_date * 1000).toLocaleString()
              : "N/A";
            const timesSubmitted = result.data.attributes.times_submitted || 0;

            result.securityAnalysis = {
              totalEngines: totalVendors,
              maliciousCount: stats.malicious,
              suspiciousCount: stats.suspicious,
              cleanCount: stats.undetected,
              maliciousRatio,
              suspiciousRatio,
              summary: stats.malicious > 0 
                ? `Detected as malware by ${stats.malicious} security vendors` 
                : (stats.suspicious > 0 
                  ? `Flagged as suspicious by ${stats.suspicious} security vendors` 
                  : `Clean. No threats detected by security vendors`),
              flaggedVendors,
              categories,
              lastAnalysisDate,
              timesSubmitted
            };

            console.log("Constructed Security Analysis for File:", result.securityAnalysis);
          }
          
          const updatedScan = await updateScan(newScan.id, {
            status,
            result: JSON.stringify(result),
          });
          
          fs.unlinkSync(filePath);
          
          return res.json(updatedScan);
        } catch (error) {
          const formData = new FormData();
          formData.append('file', new Blob([fileData]), fileName);
          
          const submitResponse = await axios.post(`${VIRUS_TOTAL_API_URL}/files`, formData, {
            headers: {
              'x-apikey': VIRUS_TOTAL_API_KEY,
            }
          });
          
          await updateScan(newScan.id, {
            result: JSON.stringify(submitResponse.data),
          });
          
          fs.unlinkSync(filePath);
          
          return res.json({
            ...newScan,
            message: "File submitted for scanning",
          });
        }
      } catch (uploadError) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw uploadError;
      }
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get scan result by ID
  app.get("/api/scan/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scan ID" });
      }
      
      const scan = await getScan(id);
      
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      
      res.json(scan);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Get scan statistics for dashboard
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const scans = await getScanHistory(1000, userId);
      
      const totalUrlScans = scans.filter(scan => scan.scanType === "url").length;
      const totalFileScans = scans.filter(scan => scan.scanType === "file").length;
      
      const maliciousScans = scans.filter(scan => scan.status === "malicious").length;
      const suspiciousScans = scans.filter(scan => scan.status === "suspicious").length;
      const cleanScans = scans.filter(scan => scan.status === "clean").length;
      const pendingScans = scans.filter(scan => scan.status === "pending").length;
      
      const recentScans = scans.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5);
      
      res.json({
        totalScans: scans.length,
        totalUrlScans,
        totalFileScans,
        maliciousScans,
        suspiciousScans,
        cleanScans,
        pendingScans,
        recentScans,
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}