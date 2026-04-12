import { create } from "zustand";
import { persist } from "zustand/middleware";

import { authClient } from "@/libs/auth";

export type AuthSession = typeof authClient.$Infer.Session;
export type AuthCredentials = Parameters<typeof authClient.signIn.email>[0];
export type AuthRegistration = Parameters<typeof authClient.signUp.email>[0];
export interface AuthActionResult {
  session: AuthSession | null;
  error: string | null;
}

interface AuthStoreState {
  session: AuthSession | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signUp: (registration: AuthRegistration) => Promise<AuthActionResult>;
  signIn: (credentials: AuthCredentials) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      session: null,
      isLoading: false,
      hasInitialized: false,

      refreshSession: async () => {
        set({ isLoading: true });

        const { data, error } = await authClient.getSession();

        if (error || !data) {
          set({ session: null, isLoading: false });
          return;
        }

        set({ session: data, isLoading: false });
      },

      signUp: async (registration) => {
        set({ isLoading: true });
        const { error } = await authClient.signUp.email(registration);

        if (error) {
          console.error("Sign up failed:", error);
          set({ isLoading: false });
          return {
            session: null,
            error: "Unable to create your account.",
          };
        }

        const { data: sessionData } = await authClient.getSession();

        set({
          session: sessionData,
          isLoading: false,
        });
        return {
          session: sessionData,
          error: sessionData
            ? null
            : "Your account was created, but the session could not be loaded.",
        };
      },

      signIn: async (credentials) => {
        set({ isLoading: true });
        const { error } = await authClient.signIn.email(credentials);
        if (error) {
          console.error("Sign in failed:", error);
          set({ isLoading: false });
          return {
            session: null,
            error: "Unable to sign in.",
          };
        }

        const { data: sessionData } = await authClient.getSession();

        set({
          session: sessionData,
          isLoading: false,
        });
        return {
          session: sessionData,
          error: sessionData
            ? null
            : "Signed in, but the session was not found.",
        };
      },

      signOut: async () => {
        set({ isLoading: true });
        await authClient.signOut();
        set({ session: null, isLoading: false });
      },
    }),
    {
      name: "auth-session",
      partialize: (state) => ({ session: state.session }),
    },
  ),
);
