import { NavigationGroup } from "@/lib/types";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ShieldCheck, LayoutDashboard, Link as LinkIcon, File, History, Settings, LogOut } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  
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

  return (
    <div className="hidden md:flex md:w-64 flex-shrink-0 flex-col bg-white shadow-md z-10 h-screen">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="ml-2 text-xl font-medium text-gray-900">SecureScan</h1>
        </div>
      </div>

      <div className="px-3 py-4 flex-grow overflow-y-auto">
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

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">US</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">User</p>
            <p className="text-xs text-gray-500">Security Analyst</p>
          </div>
          <button className="ml-auto p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
