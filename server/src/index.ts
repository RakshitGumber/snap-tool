import cors from "@elysiajs/cors";
import { Elysia } from "elysia";

import { env } from "./env";
import { authPlugin } from "./plugins/auth";
import { dbPlugin } from "./plugins/db";
import { healthRoutes } from "./routes/health";
import { postsRoutes } from "./routes/posts";

const app = new Elysia()
  .use(
    cors({
      origin: env.WEB_APP_ORIGIN,
      credentials: true,
    }),
  )
  .use(dbPlugin)
  .use(authPlugin)
  .use(healthRoutes)
  .use(postsRoutes)
  .listen(env.PORT);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
