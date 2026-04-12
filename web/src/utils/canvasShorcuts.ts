import type { CanvasActions, ShortcutMap } from "@/types/canvas";

export const buildCanvasShortcuts = (actions: CanvasActions): ShortcutMap => {
  return {
    "ctrl+z": actions.undo,
    "ctrl+shift+z": actions.redo,
    "ctrl+y": actions.redo,
    delete: actions.delete,
    backspace: actions.delete,
    "ctrl+s": actions.save,
    "ctrl+x": actions.clear,
  };
};
