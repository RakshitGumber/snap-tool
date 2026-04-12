export type CanvasActions = {
  undo: () => void;
  redo: () => void;
  delete: () => void;
  save: () => void;
  clear: () => void;
};

export type ShortcutMap = Record<string, () => void>;
