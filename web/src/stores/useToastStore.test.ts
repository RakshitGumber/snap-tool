import { describe, expect, test } from "bun:test";

import { createToastStore } from "./useToastStore";

describe("useToastStore", () => {
  test("keeps the newest toasts first and trims the stack to four", () => {
    const store = createToastStore();

    try {
      for (let index = 1; index <= 5; index += 1) {
        store.getState().pushToast({
          message: `toast-${index}`,
          durationMs: 1_000,
        });
      }

      expect(store.getState().toasts.map((toast) => toast.message)).toEqual([
        "toast-5",
        "toast-4",
        "toast-3",
        "toast-2",
      ]);
      expect(store.getTimerCount()).toBe(4);
    } finally {
      store.destroyToasts();
    }
  });

  test("dismisses a toast manually and clears its timer", () => {
    const store = createToastStore();

    try {
      const toastId = store.getState().pushToast({
        message: "dismiss me",
        durationMs: 1_000,
      });

      expect(store.getTimerCount()).toBe(1);

      store.getState().dismissToast(toastId);

      expect(store.getState().toasts).toHaveLength(0);
      expect(store.getTimerCount()).toBe(0);
    } finally {
      store.destroyToasts();
    }
  });

  test("auto-dismisses a toast and clears its timer", async () => {
    const store = createToastStore();

    try {
      store.getState().pushToast({
        message: "temporary",
        durationMs: 20,
      });

      expect(store.getState().toasts).toHaveLength(1);
      expect(store.getTimerCount()).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(store.getState().toasts).toHaveLength(0);
      expect(store.getTimerCount()).toBe(0);
    } finally {
      store.destroyToasts();
    }
  });
});
