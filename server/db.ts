import { createPool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

// Connect to MySQL using Drizzle ORM
const pool = createPool({
  host: "localhost",
  user: "root", // Replace with your MySQL username
  password: "root", // Replace with your MySQL password
  database: "cyberthreat_guardian",
});

export const db = drizzle(pool);