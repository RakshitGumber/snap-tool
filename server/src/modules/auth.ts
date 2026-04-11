import { Elysia } from "elysia";

import { auth } from "../auth";

const handleAuth = ({ request }: { request: Request }) => auth.handler(request);

export const authPlugin = new Elysia({ name: "auth-routes" })
  .all("/api/auth", handleAuth)
  .all("/api/auth/*", handleAuth);
