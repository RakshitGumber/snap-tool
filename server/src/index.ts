import cors from "@elysiajs/cors";
import { Elysia, t } from "elysia";

import { auth } from "@/lib/auth";
import { schema } from "./db/schema";

import { createSelectSchema } from "drizzle-typebox";

const UserSchema = createSelectSchema(schema.user);

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
  .get("/", () => "Aye yo brother wassup")
  .get(
    "/api/profile",
    (ctx) => {
      if (!ctx.user) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      return {
        message: "Authenticated via Eden Treaty!",
        user: {
          ...ctx.user,
          image: ctx.user.image ?? null,
        },
      };
    },
    {
      response: {
        200: t.Object({
          message: t.String(),
          user: UserSchema,
        }),
        401: t.Object({
          error: t.String(),
        }),
      },
    },
  )
  .listen(process.env.PORT);

console.log(
  `Server started at http://${app.server?.hostname}:${app.server?.port}`,
);
