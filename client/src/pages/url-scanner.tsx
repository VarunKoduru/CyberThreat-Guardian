import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScanningResult } from "@/components/ui/scanning-result";
import { InfoIcon, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* URL Scanner Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LinkIcon className="mr-2 h-5 w-5 text-primary" />
                URL Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium text-gray-700">
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

              <div className="mt-6">
                <h3 className="text-lg font-medium">Common phishing tactics to watch for:</h3>
                <div className="mt-3 space-y-4">
                  <motion.div 
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Look-alike Domains</h4>
                        <p className="text-sm text-yellow-700">
                          Phishers often use domains that look similar to legitimate ones, like
                          "amaz0n.com" or "paypa1.com".
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="p-3 bg-blue-50 border border-blue-200 rounded-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Misleading Subdomains</h4>
                        <p className="text-sm text-blue-700">
                          URLs like "paypal.secure-login.com" are deceptive - "secure-login.com" is the actual domain.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="p-3 bg-purple-50 border border-purple-200 rounded-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-800">IP Address URLs</h4>
                        <p className="text-sm text-purple-700">
                          Legitimate websites rarely use IP addresses in their URLs (e.g., http://192.168.1.1/login).
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
                <h3 className="font-medium mb-2">Before clicking links:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Hover over links to see the actual URL</li>
                  <li>Check for misspellings in domain names</li>
                  <li>Be wary of shortened URLs (bit.ly, tinyurl)</li>
                  <li>Look for HTTPS in the URL</li>
                  <li>Verify sender email addresses carefully</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">If you're unsure about a link:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Contact the supposed sender through official channels</li>
                  <li>Go directly to the website by typing the URL</li>
                  <li>Use our URL scanner before clicking</li>
                  <li>Check for secure connection (padlock icon)</li>
                </ul>
              </div>

              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">Did you know?</h3>
                <p className="text-sm text-green-700">
                  Our URL scanner checks the link against multiple security databases and scanning engines to provide comprehensive protection.
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
