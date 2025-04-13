import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScanResult } from "@/lib/types";
import { AlertCircle, CheckCircle, Clock, FileText, Link as LinkIcon, Download, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (scanResult && !isLoading && !error) {
      // Create a JSON blob for download
      const blob = new Blob([JSON.stringify(scanResult, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [scanResult, isLoading, error]);

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
            
            {downloadUrl && scanResult && !isLoading && !error && (
              <Button variant="default" onClick={() => window.open(downloadUrl, '_blank')}>
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
