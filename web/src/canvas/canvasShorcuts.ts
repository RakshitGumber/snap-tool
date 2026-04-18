import type { CanvasActions, ShortcutMap } from "@/types/canvas";

export const CanvasShortcuts = (actions: CanvasActions): ShortcutMap => ({
  delete: actions.delete,
  backspace: actions.delete,
  "ctrl+s": actions.save,
  "ctrl+x": actions.clear,
});
