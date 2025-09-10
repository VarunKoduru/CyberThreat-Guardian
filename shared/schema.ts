import { mysqlTable, bigint, int, varchar, text, datetime } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpires: datetime("resetTokenExpires"),
  createdAt: datetime("createdAt"),
});

export const scans = mysqlTable("scans", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: int("userID").notNull(),
  scanType: varchar("scan_type", { length: 20 }).notNull(),
  resource: varchar("resource", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  result: text("result"),
  createdAt: datetime("created_at"),
});