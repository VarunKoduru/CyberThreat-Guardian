import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { scans, users } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

const pool = createPool({
  host: "localhost",
  user: "root",
  password: "root", 
  database: "cyberthreat_guardian",
});

export const db = drizzle(pool);

export const getUserByEmail = async (email: string) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user[0];
};

export const getUserByUsername = async (username: string) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user[0];
};

export const getUserByResetToken = async (token: string) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, token))
    .limit(1);
  return user[0];
};

export const getScansByUserId = async (userId: number) => {
  return await db
    .select()
    .from(scans)
    .where(eq(scans.userId, userId))
    .orderBy(sql`created_at DESC`);
};

export const createUser = async (user: {
  username: string;
  email: string;
  password: string;
}) => {
  await db
    .insert(users)
    .values({
      username: user.username,
      email: user.email,
      password: user.password,
    })
    .execute();

  const newUser = await db
    .select()
    .from(users)
    .where(eq(users.username, user.username))
    .limit(1);
  return newUser[0];
};

export const createScan = async (scan: {
  userId: number;
  scanType: string;
  resource: string;
  status: string;
  result?: string | null;
}) => {
  await db
    .insert(scans)
    .values({
      userId: scan.userId,
      scanType: scan.scanType,
      resource: scan.resource,
      status: scan.status,
      result: scan.result,
    })
    .execute();

  const newScan = await db
    .select()
    .from(scans)
    .where(eq(scans.userId, scan.userId))
    .where(eq(scans.resource, scan.resource))
    .where(eq(scans.scanType, scan.scanType))
    .orderBy(sql`created_at DESC`)
    .limit(1);
  return newScan[0];
};

export const updateScan = async (scanId: number, updates: {
  status?: string;
  result?: string;
}) => {
  await db
    .update(scans)
    .set(updates)
    .where(eq(scans.id, scanId))
    .execute();

  const updatedScan = await db
    .select()
    .from(scans)
    .where(eq(scans.id, scanId))
    .limit(1);
  return updatedScan[0];
};

export const getScan = async (scanId: number) => {
  const scan = await db
    .select()
    .from(scans)
    .where(eq(scans.id, scanId))
    .limit(1);
  return scan[0];
};

export const getScanHistory = async (limit: number, userId: number) => {
  return await db
    .select()
    .from(scans)
    .where(eq(scans.userId, userId))
    .limit(limit)
    .orderBy(sql`created_at DESC`);
};

export const updateUserPasswordAndResetToken = async (
  userId: number,
  password: string,
  resetToken: string | null,
  resetTokenExpires: Date | null
) => {
  await db
    .update(users)
    .set({
      password,
      resetToken,
      resetTokenExpires,
    })
    .where(eq(users.id, userId))
    .execute();

  const updatedUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return updatedUser[0];
};

export const getStatsByUserId = async (userId: number) => {
  const totalScans = await db
    .select({ count: sql<number>`count(*)` })
    .from(scans)
    .where(eq(scans.userId, userId));

  const maliciousScans = await db
    .select({ count: sql<number>`count(*)` })
    .from(scans)
    .where(eq(scans.userId, userId))
    .where(eq(scans.status, "malicious"));

  return {
    totalScans: totalScans[0].count,
    maliciousScans: maliciousScans[0].count,
  };
};