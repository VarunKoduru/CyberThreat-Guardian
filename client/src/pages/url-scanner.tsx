import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScanningResult } from "@/components/ui/scanning-result";
import { InfoIcon, Link as LinkIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScanResult } from "@/lib/types";

export default function URLScanner() {
  const [url, setUrl] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const urlMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/scan/url", { url });
      const data = await response.json();
      return data as ScanResult;
    },
    onError: (error) => {
      toast({
        title: "Error scanning URL",
        description: error.message || "Failed to scan the URL. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic URL validation
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scan",
        variant: "destructive",
      });
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
      return;
    }

    urlMutation.mutate(urlToScan);
    setShowResults(true);
  };

  const closeResults = () => {
    setShowResults(false);
    urlMutation.reset();
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={urlMutation.isPending}
                />
                <Button 
                  type="submit" 
                  disabled={urlMutation.isPending}
                >
                  {urlMutation.isPending ? "Scanning..." : "Scan URL"}
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
            scanResult={urlMutation.data}
            isLoading={urlMutation.isPending}
            error={urlMutation.error?.message}
            resourceType="url"
            onClose={closeResults}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
