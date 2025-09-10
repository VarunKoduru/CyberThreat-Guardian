import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScanningResult } from "@/components/ui/scanning-result";
import { InfoIcon, Link as LinkIcon } from "lucide-react";

const URLScanner = () => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setShowResults(true); // Show dialog immediately

    // Basic URL validation
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scan",
        variant: "destructive",
      });
      setLoading(false);
      setShowResults(false);
      return;
    }

    // Simple URL validation
    let urlToScan = url.trim();
    if (!/^https?:\/\//i.test(urlToScan)) {
      urlToScan = "http://" + urlToScan;
      setUrl(urlToScan);
    }

    try {
      new URL(urlToScan);
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      setLoading(false);
      setShowResults(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await axios.post("http://localhost:5000/api/scan/url", {
        url: urlToScan,
        userId: user.id,
      });
      setResult(response.data);
      toast({
        title: "Scan Initiated",
        description: `Status: ${response.data.status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to scan URL",
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
        console.log("Polling URL scan result:", updatedScan);
        setResult(updatedScan);
        if (updatedScan.status !== "pending") {
          clearInterval(pollInterval);
          toast({
            title: "Scan Complete",
            description: `Status: ${updatedScan.status}`,
          });
        }
      } catch (err) {
        console.error("Error polling URL scan result:", err);
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
  };

  return (
    <div>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LinkIcon className="mr-2 h-5 w-5 text-primary" />
            URL Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">
                Enter URL to scan
              </label>
              <div className="flex space-x-2">
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Scanning..." : "Scan URL"}
                </Button>
              </div>
            </div>

            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                This tool checks if a URL is potentially dangerous by scanning it against the VirusTotal database
                which includes data from dozens of security vendors.
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <ScanningResult
            scanResult={result}
            isLoading={loading}
            error={null}
            resourceType="url"
            onClose={closeResults}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default URLScanner;