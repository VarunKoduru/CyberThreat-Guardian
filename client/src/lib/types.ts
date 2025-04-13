import { Scan, ScanStatus, ScanType } from "@shared/schema";

export interface ScanResult {
  id: number;
  scanType: ScanType;
  resource: string;
  status: ScanStatus;
  result: any;
  createdAt: Date;
}

export interface StatsCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export interface NavigationItem {
  title: string;
  icon: React.ReactNode;
  href: string;
  isActive?: boolean;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}
