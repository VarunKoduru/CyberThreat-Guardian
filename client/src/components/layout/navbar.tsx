import { useLocation } from "wouter";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavbarProps {
  toggleMobileMenu: () => void;
}

export function Navbar({ toggleMobileMenu }: NavbarProps) {
  const [location] = useLocation();
  
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/url-scanner":
        return "URL Scanner";
      case "/file-scanner":
        return "File Scanner";
      case "/scan-history":
        return "Scan History";
      case "/settings":
        return "Settings";
      default:
        return "SecureScan";
    }
  };

  const getPageDescription = () => {
    switch (location) {
      case "/":
        return "Welcome to SecureScan. Monitor your security status at a glance.";
      case "/url-scanner":
        return "Check URLs for phishing attempts and malicious content.";
      case "/file-scanner":
        return "Scan files for viruses, malware, and other threats.";
      case "/scan-history":
        return "View your previous scan results and analysis.";
      case "/settings":
        return "Configure your security preferences and settings.";
      default:
        return "Advanced security scanning tools for your protection.";
    }
  };

  return (
    <div className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="md:hidden"
            aria-label="Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-sm text-gray-600">{getPageDescription()}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-white p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <Bell className="h-6 w-6" />
            </button>
            <button className="bg-white p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <Settings className="h-6 w-6" />
            </button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              My Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
