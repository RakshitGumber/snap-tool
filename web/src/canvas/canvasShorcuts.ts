import type { CanvasActions, ShortcutMap } from "@/types/canvas";

export const CanvasShortcuts = (actions: CanvasActions): ShortcutMap => ({
  delete: actions.delete,
  backspace: actions.delete,
  "ctrl+s": actions.save,
  "ctrl+x": actions.clear,
  "ctrl+.": actions.focus.this,
  "ctrl+arrowright": actions.focus.next,
  "ctrl+arrowleft": actions.focus.prev,
  "ctrl+arrowdown": actions.focus.down,
  "ctrl+arrowup": actions.focus.up,
});
