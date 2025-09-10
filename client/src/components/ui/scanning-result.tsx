import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScanResult } from "@/lib/types";
import { AlertCircle, CheckCircle, Clock, FileText, Link as LinkIcon, Download, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";

interface ScanningResultProps {
  scanResult?: ScanResult | null;
  isLoading: boolean;
  error?: string | null;
  resourceType: "url" | "file";
  onClose: () => void;
}

export function ScanningResult({
  scanResult,
  isLoading,
  error,
  resourceType,
  onClose
}: ScanningResultProps) {
  const renderIcon = () => {
    if (isLoading) {
      return (
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="h-8 w-8 text-primary" />
          </motion.div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
      );
    }

    if (scanResult?.status === "clean") {
      return (
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
      );
    }

    if (scanResult?.status === "malicious" || scanResult?.status === "suspicious") {
      return (
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
      );
    }

    if (scanResult?.status === "pending") {
      return (
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="h-8 w-8 text-yellow-500" />
          </motion.div>
        </div>
      );
    }

    return (
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <Clock className="h-8 w-8 text-gray-500" />
      </div>
    );
  };

  const renderTitle = () => {
    if (isLoading) return "Scanning in progress...";
    if (error) return "Error scanning";
    
    switch (scanResult?.status) {
      case "clean":
        return "No Threats Detected";
      case "malicious":
        return "Threat Detected!";
      case "suspicious":
        return "Suspicious Content Detected";
      case "pending":
        return "Scan Pending";
      default:
        return "Scan Results";
    }
  };

  const renderMessage = () => {
    if (isLoading) {
      return "Please wait while we analyze your " + resourceType + ". This may take a few moments.";
    }
    
    if (error) {
      return error;
    }
    
    const result = typeof scanResult?.result === "string" ? JSON.parse(scanResult.result) : scanResult?.result;
    if (result?.securityAnalysis?.summary) {
      return result.securityAnalysis.summary;
    }
    
    switch (scanResult?.status) {
      case "clean":
        return `The ${resourceType} appears to be safe according to our security analysis.`;
      case "malicious":
        return `We've identified potential security risks with this ${resourceType}. We recommend not to use it.`;
      case "suspicious":
        return `This ${resourceType} shows some suspicious patterns. Proceed with caution.`;
      case "pending":
        return `The ${resourceType} has been submitted for scanning. Check back shortly for results.`;
      default:
        return "Scan complete.";
    }
  };

  const handleDownload = () => {
    if (!scanResult) return;

    // Parse the result if it's a string
    const result = typeof scanResult.result === "string" ? JSON.parse(scanResult.result) : scanResult.result;

    // Creating a new jsPDF instance
    const doc = new jsPDF();

    // Set background color for the entire page
    doc.setFillColor(240, 248, 255); // Light blue background (AliceBlue: RGB 240, 248, 255)
    doc.rect(0, 0, 210, 297, "F"); // A4 page size: 210mm x 297mm, "F" for fill

    // Add a decorative header rectangle
    doc.setFillColor(0, 102, 204); // Darker blue for header (RGB 0, 102, 204)
    doc.rect(0, 0, 210, 30, "F"); // Header rectangle: full width, 30mm height

    // Setting font and size for the title (white text on the header)
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255); // White text for the title
    doc.text("CyberThreat Guardian Scan Report", 20, 20);

    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0); // Black text

    // Adding generation date and scan ID
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);
    doc.text(`Scan ID: ${scanResult.id}`, 20, 46);

    // Adding Scan Summary section
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Scan Summary", 20, 60);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Result: ${renderTitle()}`, 20, 70);
    doc.text(`Message: ${renderMessage()}`, 20, 76);

    // Adding Scan Details section
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Scan Details", 20, 90);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Item Type: ${scanResult.scanType.toUpperCase()}`, 20, 100);
    doc.text(`Resource: ${scanResult.resource}`, 20, 106);
    doc.text(`Scan Date: ${new Date(scanResult.createdAt).toLocaleString()}`, 20, 112);
    doc.text(`Status: ${scanResult.status.charAt(0).toUpperCase() + scanResult.status.slice(1)}`, 20, 118);

    // Adding Security Analysis section
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Security Analysis", 20, 132);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    if (result?.securityAnalysis?.summary) {
      doc.text(`Summary: ${result.securityAnalysis.summary}`, 20, 142);
      doc.text(`Total Engines: ${result.securityAnalysis.totalEngines || 'N/A'}`, 20, 148);
      doc.text(`Malicious Count: ${result.securityAnalysis.maliciousCount || 0}`, 20, 154);
      doc.text(`Suspicious Count: ${result.securityAnalysis.suspiciousCount || 0}`, 20, 160);
      doc.text(`Clean Count: ${result.securityAnalysis.cleanCount || 0}`, 20, 166);
      doc.text(`Malicious Ratio: ${(result.securityAnalysis.maliciousRatio || 0).toFixed(2)}`, 20, 172);
      doc.text(`Suspicious Ratio: ${(result.securityAnalysis.suspiciousRatio || 0).toFixed(2)}`, 20, 178);
      doc.text(`Categories: ${result.securityAnalysis.categories || 'N/A'}`, 20, 184);
      doc.text(`Last Analysis Date: ${result.securityAnalysis.lastAnalysisDate || 'N/A'}`, 20, 190);
      doc.text(`Times Submitted: ${result.securityAnalysis.timesSubmitted || 0}`, 20, 196);

      // Add flagged vendors if available
      if (result.securityAnalysis.flaggedVendors?.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Flagged by Vendors:", 20, 206);
        doc.setFont("helvetica", "normal");
        let yPosition = 212;
        result.securityAnalysis.flaggedVendors.forEach((vendor: any) => {
          doc.text(`- ${vendor.vendor}: ${vendor.category} (${vendor.result})`, 20, yPosition);
          yPosition += 6;
        });
      }
    } else {
      doc.text("No security analysis available.", 20, 142);
    }

    // Adding Detection Summary if available
    if (result?.data?.attributes?.last_analysis_stats) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const detectionYPosition = result.securityAnalysis.flaggedVendors?.length > 0 
        ? 212 + (result.securityAnalysis.flaggedVendors.length * 6) + 10 
        : 206;
      doc.text("Detection Summary", 20, detectionYPosition);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      let yPosition = detectionYPosition + 10;
      Object.entries(result.data.attributes.last_analysis_stats).forEach(([key, value]) => {
        doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${String(value)}`, 20, yPosition);
        yPosition += 6;
      });
    }

    // Add a footer rectangle
    doc.setFillColor(0, 102, 204); // Same darker blue as the header
    doc.rect(0, 287, 210, 10, "F"); // Footer rectangle: full width, 10mm height at the bottom

    // Downloading the PDF
    doc.save(`scan-report-${scanResult.id}.pdf`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{renderTitle()}</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4">
              {renderIcon()}
              <p className="mt-4 text-center text-gray-700">{renderMessage()}</p>
            </div>
            
            {!isLoading && !error && scanResult && (
              <>
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Details</h4>
                  
                  <div className="rounded-md bg-gray-50 p-3 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Item Type:</span>
                      <span className="font-medium">
                        {scanResult.scanType === "url" ? (
                          <div className="flex items-center">
                            <LinkIcon className="h-3.5 w-3.5 mr-1" />
                            URL
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            File
                          </div>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Resource:</span>
                      <span className="font-medium max-w-[200px] truncate" title={scanResult.resource}>
                        {scanResult.resource}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Scan Date:</span>
                      <span className="font-medium">
                        {new Date(scanResult.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        scanResult.status === "clean" ? "text-green-600" :
                        scanResult.status === "malicious" ? "text-red-600" : 
                        scanResult.status === "suspicious" ? "text-yellow-600" : 
                        "text-blue-600"
                      }`}>
                        {scanResult.status.charAt(0).toUpperCase() + scanResult.status.slice(1)}
                      </span>
                    </div>
                    
                    {(() => {
                      const result = typeof scanResult.result === "string" ? JSON.parse(scanResult.result) : scanResult.result;
                      return result?.data?.attributes?.last_analysis_stats && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <h4 className="font-medium mb-1">Detection Summary:</h4>
                          <div className="space-y-1">
                            {Object.entries(result.data.attributes.last_analysis_stats).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600 capitalize">{key}:</span>
                                <span className={`font-medium ${
                                  key === 'malicious' && Number(value) > 0 ? 'text-red-600' : 
                                  key === 'suspicious' && Number(value) > 0 ? 'text-yellow-600' :
                                  key === 'undetected' && Number(value) > 0 ? 'text-green-600' : 'text-gray-800'
                                }`}>
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {(() => {
                      const result = typeof scanResult.result === "string" ? JSON.parse(scanResult.result) : scanResult.result;
                      return result?.securityAnalysis?.summary && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <h4 className="font-medium mb-1">Analysis:</h4>
                          <p className="text-sm">
                            {result.securityAnalysis.summary}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                {(scanResult.status === "malicious" || scanResult.status === "suspicious") && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                    <h4 className="font-medium mb-1">Warning:</h4>
                    <p>
                      This {resourceType} may be unsafe. We recommend not to proceed with using it.
                      {resourceType === "file" && " Do not open this file."}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {!isLoading && !error && scanResult && (
              <Button variant="default" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}