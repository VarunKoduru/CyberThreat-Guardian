import { useState, ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { NavbarMobile } from "./navbar-mobile";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Mobile navbar with menu */}
      <NavbarMobile isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <Navbar toggleMobileMenu={toggleMobileMenu} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto md:pt-6 pt-20 px-4 sm:px-6 lg:px-8 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
