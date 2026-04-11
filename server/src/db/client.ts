import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "../env";
import { schema } from "./schema";

export const client = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === "production" ? 10 : 1,
  ssl: env.DATABASE_URL.includes("sslmode=require") ? "require" : undefined,
});

export const db = drizzle(client, { schema });
