import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { ScanningResult } from "@/components/ui/scanning-result";
import { InfoIcon, FileText, AlertTriangle, File } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ScanResult } from "@/lib/types";

export default function FileScanner() {
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const fileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/scan/file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      const data = await response.json();
      return data as ScanResult;
    },
    onError: (error) => {
      toast({
        title: "Error scanning file",
        description: error.message || "Failed to scan the file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    fileMutation.mutate(file);
    setShowResults(true);
  };

  const closeResults = () => {
    setShowResults(false);
    fileMutation.reset();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Scanner Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <File className="mr-2 h-5 w-5 text-primary" />
                File Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Upload executable files to scan them for viruses, malware, trojans, and other threats.
                </p>
                
                <FileDropzone 
                  onFileSelect={handleFileSelect}
                  maxSize={25}
                  accept=".exe,.dll,.bat,.cmd,.msi,.js,.com,.scr,.ps1"
                  isLoading={fileMutation.isPending}
                />

                <Alert className="mt-4">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>How it works</AlertTitle>
                  <AlertDescription>
                    Files are securely uploaded and scanned using VirusTotal's database of
                    70+ antivirus engines. No data is stored longer than needed for scanning.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium">File types we scan:</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.div 
                    className="p-3 bg-blue-50 border border-blue-200 rounded-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex">
                      <FileText className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Executables</h4>
                        <p className="text-sm text-blue-700">
                          .exe, .dll, .com, .bat, .cmd files
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="p-3 bg-purple-50 border border-purple-200 rounded-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex">
                      <FileText className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-800">Scripts</h4>
                        <p className="text-sm text-purple-700">
                          .js, .ps1, .vbs, .bat files
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="p-3 bg-green-50 border border-green-200 rounded-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex">
                      <FileText className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-800">Installers</h4>
                        <p className="text-sm text-green-700">
                          .msi, .pkg, .deb, .rpm files
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="p-3 bg-orange-50 border border-orange-200 rounded-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex">
                      <FileText className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-800">Office Documents</h4>
                        <p className="text-sm text-orange-700">
                          .doc, .xls, .ppt files with macros
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips and Information */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Security Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Before downloading files:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Verify the source is legitimate</li>
                  <li>Check file extension before opening</li>
                  <li>Be cautious of zip/archive files</li>
                  <li>Watch out for double extensions (file.jpg.exe)</li>
                  <li>Scan with antivirus before opening</li>
                </ul>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Never open executable files (.exe, .bat, .cmd) from unknown sources, even after scanning. They could contain zero-day malware.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-medium mb-2">Common malware distribution methods:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Email attachments</li>
                  <li>Fake software updates</li>
                  <li>"Cracked" software</li>
                  <li>Malicious ads and popups</li>
                  <li>Infected USB drives</li>
                </ul>
              </div>

              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">Did you know?</h3>
                <p className="text-sm text-green-700">
                  Our file scanner uses multiple antivirus engines to provide significantly better detection rates than using a single antivirus program.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <ScanningResult
            scanResult={fileMutation.data}
            isLoading={fileMutation.isPending}
            error={fileMutation.error?.message}
            resourceType="file"
            onClose={closeResults}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
