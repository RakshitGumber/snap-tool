import { create } from "zustand";
import { persist } from "zustand/middleware";

import { authClient } from "@/libs/auth";

export type AuthSession = typeof authClient.$Infer.Session;
export type AuthCredentials = Parameters<typeof authClient.signIn.email>[0];

interface AuthStoreState {
  session: AuthSession | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signIn: (credentials: AuthCredentials) => Promise<AuthSession | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      session: null,
      isLoading: false,

      refreshSession: async () => {
        set({ isLoading: true });

        const { data, error } = await authClient.getSession();

        if (error || !data) {
          set({ session: null, isLoading: false });
          return;
        }

        set({ session: data, isLoading: false });
      },

      signIn: async (credentials) => {
        set({ isLoading: true });
        const { error } = await authClient.signIn.email(credentials);
        if (error) {
          console.error("Sign in failed:", error);
          set({ isLoading: false });
          return null;
        }

        // Fetch the active session after successful login
        const { data: sessionData } = await authClient.getSession();

        set({ session: sessionData, isLoading: false });
        return sessionData;
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
