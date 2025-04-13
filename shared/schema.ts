import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define scan result status type
export const ScanStatusEnum = z.enum(["clean", "malicious", "suspicious", "pending"]);
export type ScanStatus = z.infer<typeof ScanStatusEnum>;

// Define scan types
export const ScanTypeEnum = z.enum(["url", "file"]);
export type ScanType = z.infer<typeof ScanTypeEnum>;

// Define scans table schema
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  scanType: text("scan_type").notNull(),
  resource: text("resource").notNull(), // URL or file name
  status: text("status").notNull(), // clean, malicious, suspicious, pending
  result: jsonb("result"), // VirusTotal response
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  createdAt: true,
});

export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;
