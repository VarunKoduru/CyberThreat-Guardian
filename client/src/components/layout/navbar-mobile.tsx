import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { NavigationGroup } from "@/lib/types";
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  File, 
  History, 
  Settings, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavbarMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavbarMobile({ isOpen, onClose }: NavbarMobileProps) {
  const [location] = useLocation();
  const [mounted, setMounted] = useState(false);

  // To prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const navigationGroups: NavigationGroup[] = [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          href: "/",
          isActive: location === "/"
        },
      ]
    },
    {
      title: "Security Tools",
      items: [
        {
          title: "URL Scanner",
          icon: <LinkIcon className="h-5 w-5" />,
          href: "/url-scanner",
          isActive: location === "/url-scanner"
        },
        {
          title: "File Scanner",
          icon: <File className="h-5 w-5" />,
          href: "/file-scanner",
          isActive: location === "/file-scanner"
        },
        {
          title: "Scan History",
          icon: <History className="h-5 w-5" />,
          href: "/scan-history",
          isActive: location === "/scan-history"
        }
      ]
    },
    {
      title: "Settings",
      items: [
        {
          title: "Preferences",
          icon: <Settings className="h-5 w-5" />,
          href: "/settings",
          isActive: location === "/settings"
        }
      ]
    }
  ];

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-20 h-16 px-4 flex items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="ml-2 text-xl font-medium text-gray-900">SecureScan</h1>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-gray-900 bg-opacity-50 z-30 md:hidden transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      >
        {/* Mobile Menu Panel */}
        <div 
          className={cn(
            "absolute top-0 right-0 bottom-0 w-64 bg-white transition-transform",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">US</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">User</p>
                <p className="text-xs text-gray-500">Security Analyst</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="px-3 py-4 overflow-y-auto">
            {navigationGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-6">
                <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {group.title}
                </p>
                <nav className="mt-2 space-y-1">
                  {group.items.map((item, itemIndex) => (
                    <Link key={itemIndex} href={item.href}>
                      <a
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          item.isActive
                            ? "text-white bg-primary"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                        onClick={onClose}
                      >
                        <span
                          className={cn(
                            "mr-3",
                            item.isActive ? "text-white" : "text-gray-500"
                          )}
                        >
                          {item.icon}
                        </span>
                        {item.title}
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-gray-200 absolute bottom-0 w-full">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
