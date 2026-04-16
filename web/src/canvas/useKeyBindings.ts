import { useEffect } from "react";
import { type ShortcutMap } from "@/types/canvas";

export const useKeyboardShortcuts = (
  shortcuts: ShortcutMap,
  isActive: boolean = true,
) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const keys: string[] = [];
      if (e.ctrlKey || e.metaKey) keys.push("ctrl"); // Combines Cmd/Ctrl
      if (e.shiftKey) keys.push("shift");
      if (e.altKey) keys.push("alt");

      const keyStr = e.key.toLowerCase();
      if (!["control", "meta", "shift", "alt"].includes(keyStr)) {
        keys.push(keyStr);
      }

      const shortcutKey = keys.join("+");

      if (shortcuts[shortcutKey]) {
        e.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, isActive]);
};
