import cors from "@elysiajs/cors";
import { Elysia } from "elysia";

import { auth } from "./lib/auth";

import { splitOrigins } from "./config/helpers";

const app = new Elysia()
  .use(
    cors({
      origin: splitOrigins(process.env.FRONTEND_URL, ["http://localhost:5173"]),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .mount(auth.handler)
  .onError(({ code, error, set }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { ok: false, message: "Not Found" };
    }

    console.error(error);
    set.status = 500;
    return { ok: false, message: "Internal Server Error" };
  })
  .get("/", () => "Applying multiple filters to call myself single filter")
  .get("/api", () => "Applying multiple filters to call myself single filter")
  .listen(process.env.PORT);

export type App = typeof app;

console.log(`Server is running at ${app.server?.url}`);
