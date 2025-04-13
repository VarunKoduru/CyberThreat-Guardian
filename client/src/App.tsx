import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import URLScanner from "@/pages/url-scanner";
import FileScanner from "@/pages/file-scanner";
import ScanHistory from "@/pages/scan-history";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/url-scanner" component={URLScanner} />
      <Route path="/file-scanner" component={FileScanner} />
      <Route path="/scan-history" component={ScanHistory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
