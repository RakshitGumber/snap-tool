/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  authClient,
  type AuthCredentials,
  type AuthClientSurface,
  type AuthSession,
} from "@/libs/authClient";

interface AuthContextValue {
  client: AuthClientSurface;
  isLoading: boolean;
  session: AuthSession | null;
  refreshSession: () => Promise<void>;
  signIn: (credentials?: AuthCredentials) => Promise<AuthSession | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    void authClient.getSession().then((nextSession) => {
      if (!alive) {
        return;
      }

      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  const value: AuthContextValue = {
    client: authClient,
    isLoading,
    refreshSession: async () => {
      const nextSession = await authClient.getSession();
      setSession(nextSession);
    },
    session,
    signIn: async (credentials) => {
      const nextSession = await authClient.signIn(credentials);
      setSession(nextSession);
      return nextSession;
    },
    signOut: async () => {
      await authClient.signOut();
      setSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
