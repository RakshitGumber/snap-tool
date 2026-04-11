import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  authClient,
  type AuthCredentials,
  type AuthSession,
} from "@/libs/authClient";

interface AuthStoreState {
  session: AuthSession | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signIn: (credentials?: AuthCredentials) => Promise<AuthSession | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      session: null,
      isLoading: false,

      refreshSession: async () => {
        set({ isLoading: true });
        const session = await authClient.getSession();
        set({ session, isLoading: false });
      },

      signIn: async (credentials) => {
        set({ isLoading: true });
        const session = await authClient.signIn(credentials);
        set({ session, isLoading: false });
        return session;
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
