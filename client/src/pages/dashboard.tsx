import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/lib/types";
import { ArrowUpIcon, ArrowDownIcon, LinkIcon, FileIcon, ShieldCheck, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  // Fetch stats for dashboard
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Stats cards
  const getStatsCards = (): StatsCard[] => {
    const totalScans = stats?.totalScans || 0;
    const urlScans = stats?.totalUrlScans || 0;
    const fileScans = stats?.totalFileScans || 0;
    const threats = (stats?.maliciousScans || 0) + (stats?.suspiciousScans || 0);

    return [
      {
        title: "Total Scans",
        value: totalScans,
        icon: <ShieldCheck className="h-6 w-6 text-primary" />,
        color: "primary",
      },
      {
        title: "URL Scans",
        value: urlScans,
        icon: <LinkIcon className="h-6 w-6 text-blue-500" />,
        color: "blue"
      },
      {
        title: "File Scans",
        value: fileScans,
        icon: <FileIcon className="h-6 w-6 text-green-500" />,
        color: "green"
      },
      {
        title: "Threats Detected",
        value: threats,
        icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
        color: "red",
        trend: {
          value: threats > 0 ? "Action required" : "All clear",
          isPositive: threats === 0
        }
      }
    ];
  };

  const statsCards = getStatsCards();

  // Recent scans from stats
  const recentScans = stats?.recentScans || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "clean":
        return "bg-green-100 text-green-800";
      case "malicious":
        return "bg-red-100 text-red-800";
      case "suspicious":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "clean":
        return <ShieldCheck className="h-4 w-4" />;
      case "malicious":
        return <AlertTriangle className="h-4 w-4" />;
      case "suspicious":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <ShieldCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statsCards.map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {isLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                </div>
                {stat.trend && (
                  <p className={`mt-2 text-xs flex items-center ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend.isPositive ? (
                      <ArrowUpIcon className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDownIcon className="mr-1 h-3 w-3" />
                    )}
                    <span>{stat.trend.value}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Tools Widget */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Security Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* URL Scanner Card */}
                <Link href="/url-scanner">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <LinkIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">URL Scanner</h3>
                          <p className="text-sm text-gray-600">Check links for phishing attempts</p>
                        </div>
                      </div>
                      <Button className="mt-4 w-full">Scan a URL</Button>
                    </CardContent>
                  </Card>
                </Link>

                {/* File Scanner Card */}
                <Link href="/file-scanner">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-secondary">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                          <FileIcon className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">File Scanner</h3>
                          <p className="text-sm text-gray-600">Check files for malware</p>
                        </div>
                      </div>
                      <Button className="mt-4 w-full">Scan a File</Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scan Results */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex p-2 rounded-md">
                      <div className="w-10 h-10 rounded-full bg-gray-200 mr-2"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentScans.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No scans performed yet</p>
                  <div className="mt-4 space-x-2">
                    <Link href="/url-scanner">
                      <Button size="sm" variant="outline">Scan URL</Button>
                    </Link>
                    <Link href="/file-scanner">
                      <Button size="sm" variant="outline">Scan File</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentScans.map((scan: any) => (
                    <div key={scan.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full ${scan.scanType === 'url' ? 'bg-primary/10' : 'bg-secondary/10'} flex items-center justify-center mr-3`}>
                          {scan.scanType === 'url' ? (
                            <LinkIcon className="h-5 w-5 text-primary" />
                          ) : (
                            <FileIcon className="h-5 w-5 text-secondary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={scan.resource}>
                            {scan.resource}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(scan.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(scan.status)}`}>
                        {getStatusIcon(scan.status)}
                        <span className="ml-1 capitalize">{scan.status}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-center space-x-4">
                    <Link href="/url-scanner">
                      <Button variant="outline" size="sm">URL Scanner</Button>
                    </Link>
                    <Link href="/file-scanner">
                      <Button variant="outline" size="sm">File Scanner</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Security Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="phishing">
            <TabsList className="mb-4">
              <TabsTrigger value="phishing">Phishing Protection</TabsTrigger>
              <TabsTrigger value="malware">Malware Prevention</TabsTrigger>
              <TabsTrigger value="passwords">Password Safety</TabsTrigger>
            </TabsList>
            <TabsContent value="phishing" className="space-y-4">
              <p className="text-gray-600">
                Phishing attacks try to steal your sensitive information through deceptive emails and websites.
                Always verify the sender before clicking links or downloading attachments.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Check the URL before entering credentials</li>
                <li>Verify email sender addresses carefully</li>
                <li>Be suspicious of urgent requests for personal information</li>
                <li>Use our URL Scanner to check suspicious links</li>
              </ul>
            </TabsContent>
            <TabsContent value="malware" className="space-y-4">
              <p className="text-gray-600">
                Malware can damage your system and steal data. Be cautious about what you download and install.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Only download software from trusted sources</li>
                <li>Keep your operating system and applications updated</li>
                <li>Use our File Scanner to check downloads before opening</li>
                <li>Be wary of unexpected email attachments</li>
              </ul>
            </TabsContent>
            <TabsContent value="passwords" className="space-y-4">
              <p className="text-gray-600">
                Strong passwords are your first line of defense against unauthorized access.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Use a unique password for each account</li>
                <li>Create passwords with 12+ characters including numbers and symbols</li>
                <li>Consider using a password manager</li>
                <li>Enable two-factor authentication where available</li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
