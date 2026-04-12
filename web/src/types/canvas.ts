export type CanvasActions = {
  undo: () => void;
  redo: () => void;
  delete: () => void;
  save: () => void;
  clear: () => void;
  focus: {
    this: () => void;
    next: () => void;
    prev: () => void;
    down: () => void;
    up: () => void;
  };
};

export type ShortcutMap = Record<string, () => void>;
