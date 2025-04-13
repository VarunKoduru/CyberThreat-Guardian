import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import URLScanner from "@/pages/url-scanner";
import FileScanner from "@/pages/file-scanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={URLScanner} />
      <Route path="/file-scanner" component={FileScanner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto py-6 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Security Scanner</h1>
          <div className="flex justify-center gap-4">
            <a href="/" className="text-primary hover:underline">URL Scanner</a>
            <a href="/file-scanner" className="text-primary hover:underline">File Scanner</a>
          </div>
        </header>
        <main>
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
