import { startTransition } from "react";
import { create } from "zustand";

interface RouterState {
  route: string;
  setRoute: (path: string) => void;
}

export const useRouter = create<RouterState>((set) => ({
  route: window.location.pathname,
  setRoute: (path) => {
    window.history.pushState({}, "", path);
    startTransition(() => {
      set({ route: path });
    });
  },
}));
