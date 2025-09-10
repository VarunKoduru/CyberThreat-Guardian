import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { ScanningResult } from "@/components/ui/scanning-result";
import { InfoIcon, File } from "lucide-react";

const FileScanner = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setResult(null);
    setShowResults(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userId", user.id.toString());

      const response = await axios.post("http://localhost:5000/api/scan/file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(response.data);
      toast({
        title: "Scan Initiated",
        description: `Status: ${response.data.status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to scan file",
        variant: "destructive",
      });
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  // Polling for scan result updates if status is "pending"
  useEffect(() => {
    if (!result || result.status !== "pending" || !showResults) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/scan/${result.id}`);
        const updatedScan = response.data;
        console.log("Polling file scan result:", updatedScan);
        setResult(updatedScan);
        if (updatedScan.status !== "pending") {
          clearInterval(pollInterval);
          toast({
            title: "Scan Complete",
            description: `Status: ${updatedScan.status}`,
          });
        }
      } catch (err) {
        console.error("Error polling file scan result:", err);
        clearInterval(pollInterval);
        toast({
          title: "Error",
          description: "Failed to fetch updated scan result",
          variant: "destructive",
        });
        setShowResults(false);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval); // Cleanup on unmount or when result/showResults changes
  }, [result, showResults, toast]);

  const closeResults = () => {
    setShowResults(false);
    setResult(null);
    setFile(null);
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
              isLoading={loading}
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
            scanResult={result}
            isLoading={loading}
            error={null}
            resourceType="file"
            onClose={closeResults}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileScanner;