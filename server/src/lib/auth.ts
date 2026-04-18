import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { splitOrigins } from "../config/helpers";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { ...schema },
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
