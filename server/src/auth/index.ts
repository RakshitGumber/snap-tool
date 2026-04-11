import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { db } from "../db";
import { env, hasAuthProviderConfig } from "../env";
import { authSchema } from "../db/schema/auth";
import { sendTransactionalEmail } from "../lib/mailer";

const socialProviders: Record<
  string,
  {
    clientId: string;
    clientSecret: string;
  }
> = {};

if (hasAuthProviderConfig("google")) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID as string,
    clientSecret: env.GOOGLE_CLIENT_SECRET as string,
  };
}

if (hasAuthProviderConfig("github")) {
  socialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID as string,
    clientSecret: env.GITHUB_CLIENT_SECRET as string,
  };
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.WEB_APP_ORIGIN],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: "Reset your Snap Tool password",
        heading: "Reset your password",
        body: "Use the button below to set a new password for your Snap Tool account.",
        url,
        buttonLabel: "Reset password",
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: "Verify your Snap Tool email",
        heading: "Verify your email",
        body: "Confirm your email address to finish setting up your Snap Tool account.",
        url,
        buttonLabel: "Verify email",
      });
    },
  },
  socialProviders,
});
