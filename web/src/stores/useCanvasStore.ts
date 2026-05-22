import { create } from "zustand";

import { DEFAULT_BACKGROUND_PRESET_ID } from "@/config/backgroundPresets";
import {
  DEFAULT_CANVAS_PRESET_ID,
  getCanvasPresetById,
  type CanvasSize,
} from "@/config/canvasPresets";
import {
  getLinkCardPresetById,
  isLinkCardPresetId,
} from "@/config/linkCardPresets";
import type { LinkCardMetadata } from "@/libs/linkCards";
import { clampCardWidthRatio } from "@/libs/cardSizing";

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
};

type CanvasStoreState = LightweightCanvasSnapshot & {
  historyPast: LightweightCanvasSnapshot[];
  historyFuture: LightweightCanvasSnapshot[];
  setActiveCanvasPreset: (presetId: string) => void;
  setActiveBackground: (backgroundId: string) => void;
  setActiveCard: (card: LinkCardCanvasItem | null) => void;
  resizeActiveCard: (widthRatio: number) => void;
  beginResizeActiveCard: () => void;
  endResizeActiveCard: () => void;
  deleteActiveCard: () => void;
  clearCanvasContents: () => void;
  undo: () => void;
  redo: () => void;
};

const defaultCanvasPreset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
const STORAGE_KEY = "snap-tool:canvas:v2";
const LEGACY_STORAGE_KEY = "snap-tool:canvas:v1";
const MAX_HISTORY_LENGTH = 32;

const createDefaultSnapshot = (): LightweightCanvasSnapshot => ({
  canvasSize: defaultCanvasPreset.size,
  activeCanvasPresetId: defaultCanvasPreset.id,
  activeBackgroundId: DEFAULT_BACKGROUND_PRESET_ID,
  activeCard: null,
});

const isStoredCard = (value: unknown): value is LinkCardCanvasItem | null => {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;

  const card = value as Partial<LinkCardCanvasItem>;

  return (
    typeof card.id === "string" &&
    typeof card.presetId === "string" &&
    isLinkCardPresetId(card.presetId) &&
    typeof card.label === "string" &&
    typeof card.widthRatio === "number" &&
    typeof card.metadata === "object" &&
    card.metadata !== null
  );
};

const normalizeSnapshot = (
  value: unknown,
): LightweightCanvasSnapshot | null => {
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
    activeCard: snapshot.activeCard
      ? clampLinkCardSize(snapshot.activeCard, preset.size)
      : null,
  };
};

const loadStoredSnapshot = (storageKey: string) => {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) return null;

  try {
    return normalizeSnapshot(JSON.parse(rawValue));
  } catch {
    return null;
  }
};

const loadInitialSnapshot = () =>
  loadStoredSnapshot(STORAGE_KEY) ??
  loadStoredSnapshot(LEGACY_STORAGE_KEY) ??
  createDefaultSnapshot();

const toSnapshot = (state: LightweightCanvasSnapshot) => ({
  canvasSize: state.canvasSize,
  activeCanvasPresetId: state.activeCanvasPresetId,
  activeBackgroundId: state.activeBackgroundId,
  activeCard: state.activeCard,
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
  state: CanvasStoreState,
  nextSnapshot: LightweightCanvasSnapshot,
) => {
  const currentSnapshot = toSnapshot(state);

  if (snapshotsAreEqual(currentSnapshot, nextSnapshot)) return {};

  return {
    ...nextSnapshot,
    historyPast: [...state.historyPast, currentSnapshot].slice(
      -MAX_HISTORY_LENGTH,
    ),
    historyFuture: [],
  };
};

const clampLinkCardWidthRatio = (
  widthRatio: number,
  presetId: string,
  canvasSize: CanvasSize,
) => {
  const preset = getLinkCardPresetById(presetId);

  return clampCardWidthRatio({
    widthRatio,
    canvasSize,
    aspectRatio: preset.aspectRatio,
  });
};

const clampLinkCardSize = (
  card: LinkCardCanvasItem,
  canvasSize: CanvasSize,
): LinkCardCanvasItem => ({
  ...card,
  widthRatio: clampLinkCardWidthRatio(
    card.widthRatio,
    card.presetId,
    canvasSize,
  ),
});

const initialSnapshot = loadInitialSnapshot();

export const useCanvasStore = create<CanvasStoreState>((set) => ({
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
        activeCard: state.activeCard
          ? clampLinkCardSize(state.activeCard, preset.size)
          : null,
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
        activeCard: activeCard
          ? clampLinkCardSize(activeCard, state.canvasSize)
          : null,
      }),
    ),

  resizeActiveCard: (widthRatio) =>
    set((state) => {
      if (!state.activeCard) return {};

      return {
        activeCard: {
          ...state.activeCard,
          widthRatio: clampLinkCardWidthRatio(
            widthRatio,
            state.activeCard.presetId,
            state.canvasSize,
          ),
        },
      };
    }),

  beginResizeActiveCard: () =>
    set((state) => {
      if (!state.activeCard) return {};

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
      if (!state.activeCard) return {};

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
      }),
    ),

  undo: () =>
    set((state) => {
      const previousSnapshot = state.historyPast.at(-1);
      if (!previousSnapshot) return {};

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
      if (!nextSnapshot) return {};

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
