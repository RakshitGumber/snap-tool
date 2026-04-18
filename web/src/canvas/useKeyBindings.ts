import { useEffect, useEffectEvent } from "react";

import type { ShortcutMap } from "@/types/canvas";

const MODIFIER_KEYS = new Set(["control", "meta", "shift", "alt"]);

const getNormalizedKey = (event: KeyboardEvent) => {
  if (event.key === ".") return ".";
  return event.key.toLowerCase();
};

export const useKeyboardShortcuts = (
  shortcuts: ShortcutMap,
  isActive: boolean = true,
) => {
  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.isContentEditable
    ) {
      return;
    }

    const keys: string[] = [];
    if (event.ctrlKey || event.metaKey) keys.push("ctrl");
    if (event.shiftKey) keys.push("shift");
    if (event.altKey) keys.push("alt");

    const key = getNormalizedKey(event);
    if (!MODIFIER_KEYS.has(key)) {
      keys.push(key);
    }

    const shortcutKey = keys.join("+");
    const action = shortcuts[shortcutKey];
    if (!action) return;

    event.preventDefault();
    action();
  });

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => handleShortcut(event);

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);
};
