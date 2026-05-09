import { create } from "zustand";

import { DEFAULT_BACKGROUND_PRESET_ID } from "@/config/backgroundPresets";
import {
  DEFAULT_CANVAS_PRESET_ID,
  getCanvasPresetById,
  type CanvasSize,
} from "@/config/canvasPresets";
import type { LinkCardMetadata } from "@/libs/linkCards";

export type CardShadowSize = "none" | "sm" | "md" | "lg";

export type LinkCardCanvasItem = {
  id: string;
  presetId: string;
  label: string;
  metadata: LinkCardMetadata;
  widthRatio: number;
};

export type LightweightCanvasSnapshot = {
  canvasSize: CanvasSize;
  activeCanvasPresetId: string;
  activeBackgroundId: string;
  activeCard: LinkCardCanvasItem | null;
  cardShadowSize: CardShadowSize;
};

type ICanvas = {
  canvasSize: CanvasSize;
  activeCanvasPresetId: string;
  activeBackgroundId: string;
  activeCard: LinkCardCanvasItem | null;
  cardShadowSize: CardShadowSize;
  historyPast: LightweightCanvasSnapshot[];
  historyFuture: LightweightCanvasSnapshot[];
  setActiveCanvasPreset: (presetId: string) => void;
  setActiveBackground: (backgroundId: string) => void;
  setActiveCard: (card: LinkCardCanvasItem | null) => void;
  setCardShadowSize: (shadowSize: CardShadowSize) => void;
  resizeActiveCard: (widthRatio: number) => void;
  beginResizeActiveCard: () => void;
  endResizeActiveCard: () => void;
  deleteActiveCard: () => void;
  clearCanvasContents: () => void;
  undo: () => void;
  redo: () => void;
};

const defaultCanvasPreset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
const STORAGE_KEY = "snap-tool:canvas:v1";
const DEFAULT_CARD_SHADOW_SIZE: CardShadowSize = "none";
const MAX_HISTORY_LENGTH = 60;

const createDefaultSnapshot = (): LightweightCanvasSnapshot => ({
  canvasSize: defaultCanvasPreset.size,
  activeCanvasPresetId: defaultCanvasPreset.id,
  activeBackgroundId: DEFAULT_BACKGROUND_PRESET_ID,
  activeCard: null,
  cardShadowSize: DEFAULT_CARD_SHADOW_SIZE,
});

const isCardShadowSize = (value: unknown): value is CardShadowSize =>
  value === "none" || value === "sm" || value === "md" || value === "lg";

const isStoredCard = (value: unknown): value is LinkCardCanvasItem | null => {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;

  const card = value as Partial<LinkCardCanvasItem>;

  return (
    typeof card.id === "string" &&
    typeof card.presetId === "string" &&
    typeof card.label === "string" &&
    typeof card.widthRatio === "number" &&
    typeof card.metadata === "object" &&
    card.metadata !== null
  );
};

const normalizeSnapshot = (value: unknown): LightweightCanvasSnapshot | null => {
  if (!value || typeof value !== "object") return null;

  const snapshot = value as Partial<LightweightCanvasSnapshot>;
  const preset =
    typeof snapshot.activeCanvasPresetId === "string"
      ? getCanvasPresetById(snapshot.activeCanvasPresetId)
      : defaultCanvasPreset;
  const backgroundId =
    typeof snapshot.activeBackgroundId === "string"
      ? snapshot.activeBackgroundId
      : DEFAULT_BACKGROUND_PRESET_ID;

  if (!isStoredCard(snapshot.activeCard)) return null;

  return {
    canvasSize: preset.size,
    activeCanvasPresetId: preset.id,
    activeBackgroundId: backgroundId,
    activeCard: snapshot.activeCard,
    cardShadowSize: isCardShadowSize(snapshot.cardShadowSize)
      ? snapshot.cardShadowSize
      : DEFAULT_CARD_SHADOW_SIZE,
  };
};

const loadInitialSnapshot = () => {
  if (typeof window === "undefined") return createDefaultSnapshot();

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return createDefaultSnapshot();

    return normalizeSnapshot(JSON.parse(rawValue)) ?? createDefaultSnapshot();
  } catch {
    return createDefaultSnapshot();
  }
};

const toSnapshot = (state: LightweightCanvasSnapshot) => ({
  canvasSize: state.canvasSize,
  activeCanvasPresetId: state.activeCanvasPresetId,
  activeBackgroundId: state.activeBackgroundId,
  activeCard: state.activeCard,
  cardShadowSize: state.cardShadowSize,
});

const saveSnapshot = (snapshot: LightweightCanvasSnapshot) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage can fail in private sessions; editing should continue.
  }
};

const snapshotsAreEqual = (
  left: LightweightCanvasSnapshot,
  right: LightweightCanvasSnapshot,
) => JSON.stringify(left) === JSON.stringify(right);

const withHistory = (
  state: ICanvas,
  nextSnapshot: LightweightCanvasSnapshot,
) => {
  const currentSnapshot = toSnapshot(state);

  if (snapshotsAreEqual(currentSnapshot, nextSnapshot)) {
    return state;
  }

  return {
    ...nextSnapshot,
    historyPast: [...state.historyPast, currentSnapshot].slice(
      -MAX_HISTORY_LENGTH,
    ),
    historyFuture: [],
  };
};

const initialSnapshot = loadInitialSnapshot();

export const useCanvasStore = create<ICanvas>((set) => ({
  ...initialSnapshot,
  historyPast: [],
  historyFuture: [],

  setActiveCanvasPreset: (presetId) => {
    const preset = getCanvasPresetById(presetId);

    set((state) =>
      withHistory(state, {
        ...toSnapshot(state),
        activeCanvasPresetId: preset.id,
        canvasSize: preset.size,
      }),
    );
  },

  setActiveBackground: (backgroundId) =>
    set((state) =>
      withHistory(state, {
        ...toSnapshot(state),
        activeBackgroundId: backgroundId,
      }),
    ),

  setActiveCard: (activeCard) =>
    set((state) =>
      withHistory(state, {
        ...toSnapshot(state),
        activeCard,
      }),
    ),

  setCardShadowSize: (cardShadowSize) =>
    set((state) =>
      withHistory(state, {
        ...toSnapshot(state),
        cardShadowSize,
      }),
    ),

  resizeActiveCard: (widthRatio) =>
    set((state) => {
      if (!state.activeCard) return state;

      return {
        activeCard: {
          ...state.activeCard,
          widthRatio: Math.min(0.92, Math.max(0.12, widthRatio)),
        },
      };
    }),

  beginResizeActiveCard: () =>
    set((state) => {
      if (!state.activeCard) return state;

      return {
        historyPast: [...state.historyPast, toSnapshot(state)].slice(
          -MAX_HISTORY_LENGTH,
        ),
        historyFuture: [],
      };
    }),

  endResizeActiveCard: () => undefined,

  deleteActiveCard: () =>
    set((state) => {
      if (!state.activeCard) return state;

      return withHistory(state, {
        ...toSnapshot(state),
        activeCard: null,
      });
    }),

  clearCanvasContents: () =>
    set((state) =>
      withHistory(state, {
        ...toSnapshot(state),
        activeBackgroundId: DEFAULT_BACKGROUND_PRESET_ID,
        activeCard: null,
        cardShadowSize: DEFAULT_CARD_SHADOW_SIZE,
      }),
    ),

  undo: () =>
    set((state) => {
      const previousSnapshot = state.historyPast.at(-1);
      if (!previousSnapshot) return state;

      return {
        ...previousSnapshot,
        historyPast: state.historyPast.slice(0, -1),
        historyFuture: [toSnapshot(state), ...state.historyFuture].slice(
          0,
          MAX_HISTORY_LENGTH,
        ),
      };
    }),

  redo: () =>
    set((state) => {
      const nextSnapshot = state.historyFuture[0];
      if (!nextSnapshot) return state;

      return {
        ...nextSnapshot,
        historyPast: [...state.historyPast, toSnapshot(state)].slice(
          -MAX_HISTORY_LENGTH,
        ),
        historyFuture: state.historyFuture.slice(1),
      };
    }),
}));

useCanvasStore.subscribe((state) => {
  saveSnapshot(toSnapshot(state));
});
