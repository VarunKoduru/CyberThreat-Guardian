import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { ScanningResult } from "@/components/ui/scanning-result";
import { InfoIcon, File } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ScanResult } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";

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
    fileMutation.mutate(file, {
      onSuccess: () => {
        // Invalidate stats query to refresh dashboard data
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      }
    });
    setShowResults(true);
  };

  const closeResults = () => {
    setShowResults(false);
    fileMutation.reset();
  };

  return (
    <div>
      <Card className="mx-auto max-w-2xl">
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

            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                Files are securely uploaded and scanned using VirusTotal's database of
                70+ antivirus engines. No data is stored longer than needed for scanning.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

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
