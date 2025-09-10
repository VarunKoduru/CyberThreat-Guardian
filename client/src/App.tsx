import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import URLScanner from "@/pages/url-scanner";
import FileScanner from "@/pages/file-scanner";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ResetPassword from "@/pages/ResetPassword";
import { useEffect, useState } from "react";

// ProtectedRoute component to guard routes that require authentication
const ProtectedRoute = ({ component: Component }: { component: React.ComponentType }) => {
  const [user] = useState(localStorage.getItem("user"));
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  return user ? <Component /> : null;
};

// PublicRoute component for routes that should only be accessible when not logged in
const PublicRoute = ({ component: Component }: { component: React.ComponentType }) => {
  const [user] = useState(localStorage.getItem("user"));
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return user ? null : <Component />;
};

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/url-scanner">
        <ProtectedRoute component={URLScanner} />
      </Route>
      <Route path="/file-scanner">
        <ProtectedRoute component={FileScanner} />
      </Route>
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>
      <Route path="/signup">
        <PublicRoute component={Signup} />
      </Route>
      <Route path="/reset-password">
        <ResetPassword />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<{ id: number; username: string; email: string } | null>(null);
  const [location, setLocation] = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Check if user is logged in on app load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log("Stored user on load:", storedUser); // Debug log
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log("User set on load:", parsedUser); // Debug log
      if (location === "/login" || location === "/signup") {
        setLocation("/");
      }
    } else {
      if (location !== "/login" && location !== "/signup" && location !== "/reset-password") {
        setLocation("/login");
      }
    }
  }, [location, setLocation]);

  // Listen for custom event to update user state after signup/login
  useEffect(() => {
    const handleUserUpdate = () => {
      const storedUser = localStorage.getItem("user");
      console.log("User update event - stored user:", storedUser); // Debug log
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("User set after update:", parsedUser); // Debug log
      } else {
        setUser(null);
      }
    };

    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  // Log user state whenever it changes
  useEffect(() => {
    console.log("Current user state:", user);
  }, [user]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setLocation("/login");
    window.dispatchEvent(new Event("user-updated"));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto py-6 px-4">
      <header className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">CyberThreat Guardian</h1>
          <nav className="flex justify-center gap-4 mb-4">
            <Link href="/" className="text-2xl text-gray-950 hover:text-red-600 hover:underline hover:scale-110 transition-all">
              Dashboard
            </Link>
            <Link href="/url-scanner" className="text-2xl text-gray-950 hover:text-red-600 hover:underline hover:scale-110 transition-all">
              URL Scanner
            </Link>
            <Link href="/file-scanner" className="text-2xl text-gray-950 hover:text-red-600 hover:underline hover:scale-110 transition-all">
              File Scanner
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="text-2xl text-gray-950 hover:text-red-600 hover:underline hover:scale-110 transition-all focus:outline-none"
              >
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="text-2xl text-gray-950 hover:text-red-600 hover:underline hover:scale-110 transition-all">
                  Login
                </Link>
                <Link href="/signup" className="text-2xl text-gray-950 hover:text-red-600 hover:underline hover:scale-110 transition-all">
                  Signup
                </Link>
              </>
            )}
          </nav>
          {user && (
            <div className="text-xl font-semibold text-gray-950 text-center">
              Welcome, {user.username}
            </div>
          )}
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