import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScanningResult } from "@/components/ui/scanning-result";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  File, 
  Link as LinkIcon, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Search
} from "lucide-react";
import { Scan } from "@shared/schema";

export default function ScanHistory() {
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  
  const { data: scans, isLoading, error } = useQuery({
    queryKey: ["/api/scans/history"],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "clean":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "malicious":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "suspicious":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "pending":
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "clean":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "malicious":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "suspicious":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "pending":
      default:
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }
  };

  const viewScanDetails = (scan: Scan) => {
    setSelectedScan(scan);
    setViewDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5 text-primary" />
            Scan History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex p-4 rounded-md border border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Scan History</h3>
              <p className="text-gray-600">
                {error instanceof Error ? error.message : "Failed to load scan history. Please try again."}
              </p>
            </div>
          ) : scans?.length === 0 ? (
            <div className="text-center py-10">
              <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Scan History</h3>
              <p className="text-gray-600 mb-6">
                You haven't performed any scans yet. Start by scanning a URL or file.
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" className="flex items-center" asChild>
                  <a href="/url-scanner">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Scan URL
                  </a>
                </Button>
                <Button variant="outline" className="flex items-center" asChild>
                  <a href="/file-scanner">
                    <File className="mr-2 h-4 w-4" />
                    Scan File
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {scans.map((scan: Scan) => (
                <div 
                  key={scan.id} 
                  className="p-4 rounded-md border border-gray-200 hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => viewScanDetails(scan)}
                >
                  <div className="flex items-start md:items-center flex-col md:flex-row gap-4">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full ${scan.scanType === 'url' ? 'bg-primary/10' : 'bg-secondary/10'} flex items-center justify-center mr-4`}>
                        {scan.scanType === 'url' ? (
                          <LinkIcon className="h-6 w-6 text-primary" />
                        ) : (
                          <File className="h-6 w-6 text-secondary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 truncate max-w-xs" title={scan.resource}>
                          {scan.resource}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(scan.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-0 md:ml-auto mt-3 md:mt-0">
                      <Badge 
                        className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scan.status)}`}
                      >
                        {getStatusIcon(scan.status)}
                        <span className="ml-1 capitalize">{scan.status}</span>
                      </Badge>
                      <Button variant="ghost" size="sm" className="ml-2">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-md">
          <ScanningResult
            scanResult={selectedScan}
            isLoading={false}
            error={null}
            resourceType={selectedScan?.scanType === 'url' ? 'url' : 'file'}
            onClose={() => setViewDetailsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
