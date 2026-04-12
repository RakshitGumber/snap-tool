import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export default defineConfig({
  out: "./migrations",
  schema: "./src/db/schema",
  breakpoints: true,
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  casing: "snake_case",
});
