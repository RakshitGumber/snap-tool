import Elysia from "elysia";
import { auth } from "@/lib/auth";

export const betterAuth = new Elysia({ name: "better-auth" }).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({
        headers,
      });

      if (!session)
        return status(401, {
          success: false,
          message:
            "Unauthorized: Please check your credentials and permissions",
        });

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});
