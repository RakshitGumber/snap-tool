import cors from "@elysiajs/cors";
import { Elysia } from "elysia";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.WEB_APP_ORIGIN,
      credentials: true,
    }),
  )
  .listen(process.env.PORT);

console.log(
  `Server started at http://${app.server?.hostname}:${app.server?.port}`,
);
