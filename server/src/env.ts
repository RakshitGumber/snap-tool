const required = (name: string) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const optional = (name: string) => process.env[name]?.trim() || undefined;

const optionalNumber = (name: string, fallback: number) => {
  const value = optional(name);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer`);
  }

  return parsed;
};

const optionalBoolean = (name: string, fallback: boolean) => {
  const value = optional(name);

  if (!value) {
    return fallback;
  }

  if (["1", "true", "yes", "on"].includes(value.toLowerCase())) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(value.toLowerCase())) {
    return false;
  }

  throw new Error(`Environment variable ${name} must be a boolean`);
};

export const env = {
  NODE_ENV: process.env.NODE_ENV?.trim() || "development",
  PORT: optionalNumber("PORT", 3000),
  DATABASE_URL: required("DATABASE_URL"),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: optional("BETTER_AUTH_URL") || `http://localhost:${optionalNumber("PORT", 3000)}`,
  WEB_APP_ORIGIN: optional("WEB_APP_ORIGIN") || "http://localhost:5173",
  GOOGLE_CLIENT_ID: optional("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optional("GOOGLE_CLIENT_SECRET"),
  GITHUB_CLIENT_ID: optional("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: optional("GITHUB_CLIENT_SECRET"),
  SMTP_HOST: optional("SMTP_HOST"),
  SMTP_PORT: optionalNumber("SMTP_PORT", 587),
  SMTP_USER: optional("SMTP_USER"),
  SMTP_PASSWORD: optional("SMTP_PASSWORD"),
  SMTP_SECURE: optionalBoolean("SMTP_SECURE", false),
  EMAIL_FROM: optional("EMAIL_FROM") || "Snap Tool <no-reply@snap-tool.local>",
} as const;

export const hasAuthProviderConfig = (provider: "google" | "github") => {
  if (provider === "google") {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }

  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
};
