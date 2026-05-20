import { startTransition } from "react";

import { create } from "zustand";

type RouterState = {
  route: string;
  setRoute: (path: string) => void;
};

export const useRouter = create<RouterState>((set) => ({
  route: window.location.pathname,
  setRoute: (path) => {
    const nextUrl = new URL(path, window.location.href);
    window.history.pushState(
      {},
      "",
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
    startTransition(() => {
      set({ route: nextUrl.pathname });
    });
  },
}));
