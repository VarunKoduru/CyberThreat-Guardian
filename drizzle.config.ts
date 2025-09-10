import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: "localhost",
    user: "root",
    password: "root", // Replace with your MySQL password
    database: "cyberthreat_guardian",
  },
});