export interface AuthUser {
  id: string;
  name?: string | null;
  email: string;
  emailVerified: boolean;
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
  name?: string;
}

const getDefaultAuthBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_AUTH_BASE_URL;
  return typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0
    ? envBaseUrl.trim()
    : "/api/auth";
};

export const createAuthClient = (baseUrl = getDefaultAuthBaseUrl()) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  const apiCall = async <T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: unknown,
  ): Promise<T | null> => {
    try {
      const response = await fetch(`${normalizedBaseUrl}${endpoint}`, {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) return null;

      if (endpoint === "/sign-out") return null;

      return (await response.json()) as T;
    } catch {
      return null;
    }
  };

  return {
    baseUrl: normalizedBaseUrl,

    getSession: () => apiCall<AuthSession>("/session"),

    signIn: (credentials?: AuthCredentials) =>
      apiCall<AuthSession>("/sign-in", "POST", credentials ?? {}),

    signUp: (credentials?: AuthCredentials) =>
      apiCall<AuthSession>("/sign-up", "POST", credentials ?? {}),

    signOut: async () => {
      await apiCall("/sign-out", "POST");
    },

    // --- Email Verification Endpoints (Standard Better Auth Flow) ---

    sendVerificationEmail: async (email: string) => {
      await apiCall("/send-verification-email", "POST", { email });
    },

    verifyEmail: async (token: string) => {
      // Sends the token from the URL back to the server to verify the user
      return apiCall<AuthSession>("/verify-email", "POST", { token });
    },
  };
};

export const authClient = createAuthClient();
