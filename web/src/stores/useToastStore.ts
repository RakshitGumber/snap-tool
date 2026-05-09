// Deprecated
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export type ToastInput = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

export type ToastRecord = {
  id: string;
  title: string | null;
  message: string;
  variant: ToastVariant;
  durationMs: number;
};

type ToastState = {
  toasts: ToastRecord[];
};

type ToastActions = {
  pushToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

export type ToastStore = ToastState & ToastActions;

type ToastStoreApi = ReturnType<typeof createToastStore>;

const MAX_VISIBLE_TOASTS = 4;

const TOAST_DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  info: 4000,
};

const createToastId = () => {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.randomUUID
  ) {
    return window.crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 12);
};

export const createToastStore = () => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const clearTimer = (id: string) => {
    const timer = timers.get(id);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    timers.delete(id);
  };

  const clearAllTimers = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  };

  const store = createStore<ToastStore>()((set, get) => ({
    toasts: [],

    pushToast: (input) => {
      const id = createToastId();
      const variant = input.variant ?? "info";
      const durationMs = input.durationMs ?? TOAST_DURATIONS[variant];
      const nextToast: ToastRecord = {
        id,
        title: input.title ?? null,
        message: input.message,
        variant,
        durationMs,
      };

      const previousToasts = get().toasts;
      const nextToasts = [nextToast, ...previousToasts].slice(
        0,
        MAX_VISIBLE_TOASTS,
      );
      const visibleToastIds = new Set(nextToasts.map((toast) => toast.id));

      for (const toast of previousToasts) {
        if (!visibleToastIds.has(toast.id)) {
          clearTimer(toast.id);
        }
      }

      clearTimer(id);
      set({ toasts: nextToasts });

      if (durationMs > 0) {
        timers.set(
          id,
          setTimeout(() => {
            get().dismissToast(id);
          }, durationMs),
        );
      }

      return id;
    },

    dismissToast: (id) => {
      clearTimer(id);
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    },

    clearToasts: () => {
      clearAllTimers();
      set({ toasts: [] });
    },
  }));

  return Object.assign(store, {
    getTimerCount: () => timers.size,
    destroyToasts: () => {
      clearAllTimers();
      store.getState().clearToasts();
    },
  });
};

export const toastStore: ToastStoreApi = createToastStore();

export const useToastStore = <T>(selector: (state: ToastStore) => T) =>
  useStore(toastStore, selector);

export const pushToast = (input: ToastInput) =>
  toastStore.getState().pushToast(input);
