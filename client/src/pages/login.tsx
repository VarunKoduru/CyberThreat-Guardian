import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "../hooks/use-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); // Added email field
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("User stored in localStorage:", data.user);
        window.dispatchEvent(new Event("user-updated"));
        toast({
          title: "Success",
          description: "Logged in successfully! Redirecting to dashboard...",
        });
        setUsername("");
        setEmail("");
        setPassword("");
        setTimeout(() => {
          setLocation("/");
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to log in",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: "Password reset request sent! Check your email (simulated).",
        });
        setForgotEmail("");
        setShowForgotPassword(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send reset request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {!showForgotPassword ? (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full p-2 text-white rounded ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-gray-600">
              Forgot your password?{" "}
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-600 hover:underline focus:outline-none"
              >
                Reset it
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
            <form onSubmit={handleForgotPassword}>
              <div className="mb-6">
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className={`w-full p-2 text-white rounded ${
                  forgotLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {forgotLoading ? "Sending..." : "Send Reset Request"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Back to{" "}
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-blue-600 hover:underline focus:outline-none"
              >
                Log in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;