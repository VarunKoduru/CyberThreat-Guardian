import { 
  users, 
  type User, 
  type InsertUser, 
  scans, 
  type Scan, 
  type InsertScan 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Scan related methods
  createScan(scan: InsertScan): Promise<Scan>;
  getScan(id: number): Promise<Scan | undefined>;
  updateScan(id: number, data: Partial<InsertScan>): Promise<Scan | undefined>;
  getScanHistory(limit: number): Promise<Scan[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scansData: Map<number, Scan>;
  private userCurrentId: number;
  private scanCurrentId: number;

  constructor() {
    this.users = new Map();
    this.scansData = new Map();
    this.userCurrentId = 1;
    this.scanCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.scanCurrentId++;
    const createdAt = new Date();
    const scan: Scan = { 
      ...insertScan, 
      id, 
      createdAt 
    };
    
    this.scansData.set(id, scan);
    return scan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    return this.scansData.get(id);
  }

  async updateScan(id: number, data: Partial<InsertScan>): Promise<Scan | undefined> {
    const scan = this.scansData.get(id);
    if (!scan) return undefined;

    const updatedScan: Scan = {
      ...scan,
      ...data,
    };

    this.scansData.set(id, updatedScan);
    return updatedScan;
  }

  async getScanHistory(limit: number): Promise<Scan[]> {
    return Array.from(this.scansData.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
