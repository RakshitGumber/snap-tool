import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { splitOrigins } from "@/config/helpers";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: splitOrigins(process.env.FRONTEND_URL, [
    "http://localhost:5173",
  ]),
  emailAndPassword: {
    enabled: true,
  },
});
