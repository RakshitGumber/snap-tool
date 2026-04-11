import { Elysia } from "elysia";

import { db } from "../db";
import { users } from "../db/schema/auth";

export const healthRoutes = new Elysia({ name: "health-routes" })
  .get("/", () => ({ status: "ok" }))
  .get("/health", async () => {
    await db.select().from(users).limit(1);

    return {
      status: "ok",
    };
  });
