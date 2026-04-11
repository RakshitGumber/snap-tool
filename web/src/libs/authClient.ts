export interface AuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface AuthSession {
  user: AuthUser | null;
  expiresAt?: string | null;
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  provider?: string;
}

export interface AuthClientSurface {
  baseUrl: string;
  getSession: () => Promise<AuthSession | null>;
  signIn: (credentials?: AuthCredentials) => Promise<AuthSession | null>;
  signOut: () => Promise<void>;
}

const safeReadJson = async <T,>(response: Response): Promise<T | null> => {
  if (!response.ok) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const getDefaultAuthBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_AUTH_BASE_URL;

  return typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0
    ? envBaseUrl.trim()
    : "/api/auth";
};

export const createAuthClient = (baseUrl = getDefaultAuthBaseUrl()): AuthClientSurface => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  return {
    baseUrl: normalizedBaseUrl,
    async getSession() {
      try {
        const response = await fetch(`${normalizedBaseUrl}/session`, {
          credentials: "include",
        });

        return safeReadJson<AuthSession>(response);
      } catch {
        return null;
      }
    },
    async signIn(credentials) {
      try {
        const response = await fetch(`${normalizedBaseUrl}/sign-in`, {
          body: JSON.stringify(credentials ?? {}),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        return safeReadJson<AuthSession>(response);
      } catch {
        return null;
      }
    },
    async signOut() {
      try {
        await fetch(`${normalizedBaseUrl}/sign-out`, {
          credentials: "include",
          method: "POST",
        });
      } catch {
        return;
      }
    },
  };
};

export const authClient = createAuthClient();
