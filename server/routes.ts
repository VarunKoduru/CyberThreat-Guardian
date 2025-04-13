import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScanSchema } from "@shared/schema";
import multer from "multer";
import axios from "axios";
import crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { ZodError } from "zod";

const VIRUS_TOTAL_API_KEY = process.env.VIRUS_TOTAL_API_KEY || "demo-key";
const VIRUS_TOTAL_API_URL = "https://www.virustotal.com/api/v3";

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
      // Create unique filename with original extension
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileExt = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${fileExt}`);
    },
  }),
  limits: {
    fileSize: 26 * 1024 * 1024, // 26MB max file size (VirusTotal limit is 32MB)
  },
});

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

  // URL Scan endpoint
  app.post("/api/scan/url", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      // Create initial record
      const newScan = await storage.createScan({
        scanType: "url",
        resource: url,
        status: "pending",
        result: null
      });
      
      // Start by checking if the URL is already in VirusTotal database
      try {
        // Create SHA-256 hash of the URL
        const urlHash = crypto.createHash('sha256').update(url).digest('hex');
        
        const response = await axios.get(`${VIRUS_TOTAL_API_URL}/urls/${urlHash}`, {
          headers: {
            "x-apikey": VIRUS_TOTAL_API_KEY
          }
        });
        
        const result = response.data;
        let status = "clean";
        
        // Parse the VirusTotal response and determine status
        if (result.data?.attributes?.last_analysis_stats) {
          const stats = result.data.attributes.last_analysis_stats;
          
          // Determine severity based on malicious/suspicious counts and security vendors
          const statsValues = Object.values(stats) as number[];
          const totalVendors = statsValues.reduce((acc: number, val: number) => acc + val, 0);
          const maliciousRatio = stats.malicious / totalVendors;
          const suspiciousRatio = stats.suspicious / totalVendors;
          
          if (stats.malicious > 3 || maliciousRatio > 0.1) {
            status = "malicious";
          } else if (stats.malicious > 0 || stats.suspicious > 0 || suspiciousRatio > 0.1) {
            status = "suspicious";
          }
          
          // Add a new property with a detailed description
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
                : `Clean. No threats detected by security vendors`)
          };
        }
        
        // Update the scan record
        const updatedScan = await storage.updateScan(newScan.id, {
          status,
          result
        });
        
        return res.json(updatedScan);
      } catch (error) {
        // If URL isn't in database, submit it for scanning
        const formData = new URLSearchParams();
        formData.append('url', url);
        
        const submitResponse = await axios.post(`${VIRUS_TOTAL_API_URL}/urls`, formData, {
          headers: {
            'x-apikey': VIRUS_TOTAL_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        // Update with analysis ID
        await storage.updateScan(newScan.id, {
          result: submitResponse.data
        });
        
        return res.json({
          ...newScan,
          message: "URL submitted for scanning"
        });
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
      
      const filePath = req.file.path;
      const fileName = req.file.originalname;
      
      // Create initial record
      const newScan = await storage.createScan({
        scanType: "file",
        resource: fileName,
        status: "pending",
        result: null
      });
      
      try {
        // Read file for upload to VirusTotal
        const fileData = fs.readFileSync(filePath);
        
        // Get file hash to check first if it's already analyzed
        const fileHash = crypto.createHash('sha256').update(fileData).digest('hex');
        
        // Check if file is already analyzed
        try {
          const response = await axios.get(`${VIRUS_TOTAL_API_URL}/files/${fileHash}`, {
            headers: {
              "x-apikey": VIRUS_TOTAL_API_KEY
            }
          });
          
          const result = response.data;
          let status = "clean";
          
          // Parse the VirusTotal response and determine status
          if (result.data?.attributes?.last_analysis_stats) {
            const stats = result.data.attributes.last_analysis_stats;
            
            // Determine severity based on malicious/suspicious counts and security vendors
            const statsValues = Object.values(stats) as number[];
            const totalVendors = statsValues.reduce((acc: number, val: number) => acc + val, 0);
            const maliciousRatio = stats.malicious / totalVendors;
            const suspiciousRatio = stats.suspicious / totalVendors;
            
            if (stats.malicious > 3 || maliciousRatio > 0.1) {
              status = "malicious";
            } else if (stats.malicious > 0 || stats.suspicious > 0 || suspiciousRatio > 0.1) {
              status = "suspicious";
            }
            
            // Add a new property with a detailed description
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
                  : `Clean. No threats detected by security vendors`)
            };
          }
          
          // Update the scan record
          const updatedScan = await storage.updateScan(newScan.id, {
            status,
            result
          });
          
          // Clean up temp file
          fs.unlinkSync(filePath);
          
          return res.json(updatedScan);
        } catch (error) {
          // If file isn't in database, submit it for scanning
          const formData = new FormData();
          formData.append('file', new Blob([fileData]), fileName);
          
          const submitResponse = await axios.post(`${VIRUS_TOTAL_API_URL}/files`, formData, {
            headers: {
              'x-apikey': VIRUS_TOTAL_API_KEY,
            }
          });
          
          // Update with analysis ID
          await storage.updateScan(newScan.id, {
            result: submitResponse.data
          });
          
          // Clean up temp file
          fs.unlinkSync(filePath);
          
          return res.json({
            ...newScan,
            message: "File submitted for scanning"
          });
        }
      } catch (uploadError) {
        // Clean up temp file if there was an error
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw uploadError;
      }
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get scan result by ID - needed for individual scan results
  app.get("/api/scan/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scan ID" });
      }
      
      const scan = await storage.getScan(id);
      
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
      const scans = await storage.getScanHistory(1000); // Get a large number of scans
      
      // Calculate total number of scans by type
      const totalUrlScans = scans.filter(scan => scan.scanType === "url").length;
      const totalFileScans = scans.filter(scan => scan.scanType === "file").length;
      
      // Calculate number of scans by status
      const maliciousScans = scans.filter(scan => scan.status === "malicious").length;
      const suspiciousScans = scans.filter(scan => scan.status === "suspicious").length;
      const cleanScans = scans.filter(scan => scan.status === "clean").length;
      const pendingScans = scans.filter(scan => scan.status === "pending").length;
      
      // Get most recent scans
      const recentScans = scans.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);
      
      res.json({
        totalScans: scans.length,
        totalUrlScans,
        totalFileScans,
        maliciousScans,
        suspiciousScans,
        cleanScans,
        pendingScans,
        recentScans
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
