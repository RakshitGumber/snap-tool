import cors from "@elysiajs/cors";
import { Elysia } from "elysia";

import { auth } from "@/lib/auth";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.WEB_APP_ORIGIN,
      credentials: true,
    }),
  )
  .all("/api/auth/*", async (ctx) => {
    return auth.handler(ctx.request);
  })
  .derive(async (ctx) => {
    const session = await auth.api.getSession({
      headers: ctx.request.headers,
    });
    return {
      user: session?.user,
      session: session?.session,
    };
  })
  .get("/", () => "Welcome to Elysia + Better Auth!")
  .get("/profile", (ctx) => {
    if (!ctx.user) {
      ctx.set.status = 401;
      return { error: "Unauthorized. Please log in." };
    }

    return {
      message: "You are authenticated!",
      user: ctx.user,
    };
  })
  .listen(process.env.PORT);

console.log(
  `Server started at http://${app.server?.hostname}:${app.server?.port}`,
);
