import { create } from "zustand";

import { DEFAULT_BACKGROUND_PRESET_ID } from "@/config/backgroundPresets";
import {
  DEFAULT_CANVAS_PRESET_ID,
  getCanvasPresetById,
  type CanvasSize,
} from "@/config/canvasPresets";
import { isLinkCardPresetId } from "@/config/linkCardPresets";
import {
  createYouTubeComposition,
  normalizeComposition,
  type CanvasComposition,
  type CanvasFontFamily,
  type ImageShadowPreset,
  type TextPosition,
} from "@/libs/canvasComposition";
import type {
  LinkCardMetadata,
  YouTubeLinkCardMetadata,
} from "@/libs/linkCards";

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
  activeComposition: CanvasComposition | null;
};

type TextSettingsPatch = Partial<{
  fontFamily: CanvasFontFamily;
  fontSize: number;
  position: TextPosition;
  overlayEnabled: boolean;
}>;

type ImageSettingsPatch = Partial<{
  radius: number;
  shadow: ImageShadowPreset;
}>;

type LayoutSettingsPatch = Partial<{
  spacing: number;
}>;

type CanvasStoreState = LightweightCanvasSnapshot & {
  historyPast: LightweightCanvasSnapshot[];
  historyFuture: LightweightCanvasSnapshot[];
  setActiveCanvasPreset: (presetId: string) => void;
  setActiveBackground: (backgroundId: string) => void;
  setActiveYouTubeComposition: (metadata: YouTubeLinkCardMetadata) => void;
  resizeActiveImage: (widthRatio: number) => void;
  beginResizeActiveImage: () => void;
  endResizeActiveImage: () => void;
  updateTextValue: (value: string) => void;
  updateTextSettings: (patch: TextSettingsPatch) => void;
  updateImageSettings: (patch: ImageSettingsPatch) => void;
  updateLayoutSettings: (patch: LayoutSettingsPatch) => void;
  deleteActiveComposition: () => void;
  clearCanvasContents: () => void;
  undo: () => void;
  redo: () => void;
};

const defaultCanvasPreset = getCanvasPresetById(DEFAULT_CANVAS_PRESET_ID);
const STORAGE_KEY = "snap-tool:canvas:v3";
const LEGACY_STORAGE_KEY = "snap-tool:canvas:v2";
const MAX_HISTORY_LENGTH = 32;

const createDefaultSnapshot = (): LightweightCanvasSnapshot => ({
  canvasSize: defaultCanvasPreset.size,
  activeCanvasPresetId: defaultCanvasPreset.id,
  activeBackgroundId: DEFAULT_BACKGROUND_PRESET_ID,
  activeComposition: null,
});

const isStoredLegacyCard = (
  value: unknown,
): value is LinkCardCanvasItem | null => {
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

const isStoredComposition = (
  value: unknown,
): value is CanvasComposition | null => {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;

  const composition = value as Partial<CanvasComposition>;

  return (
    composition.source === "youtube" &&
    typeof composition.id === "string" &&
    typeof composition.metadata === "object" &&
    composition.metadata !== null &&
    composition.metadata.source === "youtube" &&
    typeof composition.image === "object" &&
    composition.image !== null &&
    typeof composition.image.src === "string" &&
    typeof composition.image.aspectRatio === "number" &&
    typeof composition.image.widthRatio === "number" &&
    typeof composition.image.radius === "number" &&
    typeof composition.text === "object" &&
    composition.text !== null &&
    typeof composition.text.value === "string" &&
    typeof composition.text.fontFamily === "string" &&
    typeof composition.text.fontSize === "number" &&
    typeof composition.text.position === "string" &&
    typeof composition.text.overlay === "object" &&
    composition.text.overlay !== null &&
    typeof composition.text.overlay.enabled === "boolean" &&
    typeof composition.layout === "object" &&
    composition.layout !== null &&
    typeof composition.layout.spacing === "number"
  );
};

const migrateLegacyCard = (
  card: LinkCardCanvasItem | null,
  canvasSize: CanvasSize,
) => {
  if (!card || card.metadata.source !== "youtube") return null;

  const composition = createYouTubeComposition(card.metadata);

  return normalizeComposition(
    {
      ...composition,
      image: {
        ...composition.image,
        widthRatio: card.widthRatio,
      },
    },
    canvasSize,
  );
};

const normalizeSnapshot = (
  value: unknown,
): LightweightCanvasSnapshot | null => {
  if (!value || typeof value !== "object") return null;

  const snapshot = value as Partial<
    LightweightCanvasSnapshot & { activeCard?: unknown }
  >;
  const preset =
    typeof snapshot.activeCanvasPresetId === "string"
      ? getCanvasPresetById(snapshot.activeCanvasPresetId)
      : defaultCanvasPreset;
  const backgroundId =
    typeof snapshot.activeBackgroundId === "string"
      ? snapshot.activeBackgroundId
      : DEFAULT_BACKGROUND_PRESET_ID;

  if (isStoredComposition(snapshot.activeComposition)) {
    return {
      canvasSize: preset.size,
      activeCanvasPresetId: preset.id,
      activeBackgroundId: backgroundId,
      activeComposition: snapshot.activeComposition
        ? normalizeComposition(snapshot.activeComposition, preset.size)
        : null,
    };
  }

  if (isStoredLegacyCard(snapshot.activeCard)) {
    return {
      canvasSize: preset.size,
      activeCanvasPresetId: preset.id,
      activeBackgroundId: backgroundId,
      activeComposition: migrateLegacyCard(snapshot.activeCard, preset.size),
    };
  }

  return null;
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
  activeComposition: state.activeComposition,
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

const updateActiveComposition = (
  state: CanvasStoreState,
  updater: (composition: CanvasComposition) => CanvasComposition,
) => {
  if (!state.activeComposition) return {};

  return withHistory(state, {
    ...toSnapshot(state),
    activeComposition: normalizeComposition(
      updater(state.activeComposition),
      state.canvasSize,
    ),
  });
};

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
        activeComposition: state.activeComposition
          ? normalizeComposition(state.activeComposition, preset.size)
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

  setActiveYouTubeComposition: (metadata) =>
    set((state) =>
      withHistory(state, {
        ...toSnapshot(state),
        activeComposition: normalizeComposition(
          createYouTubeComposition(metadata),
          state.canvasSize,
        ),
      }),
    ),

  resizeActiveImage: (widthRatio) =>
    set((state) => {
      if (!state.activeComposition) return {};

      return {
        activeComposition: normalizeComposition(
          {
            ...state.activeComposition,
            image: {
              ...state.activeComposition.image,
              widthRatio,
            },
          },
          state.canvasSize,
        ),
      };
    }),

  beginResizeActiveImage: () =>
    set((state) => {
      if (!state.activeComposition) return {};

      return {
        historyPast: [...state.historyPast, toSnapshot(state)].slice(
          -MAX_HISTORY_LENGTH,
        ),
        historyFuture: [],
      };
    }),

  endResizeActiveImage: () => undefined,

  updateTextValue: (value) =>
    set((state) =>
      updateActiveComposition(state, (composition) => ({
        ...composition,
        text: {
          ...composition.text,
          value,
        },
      })),
    ),

  updateTextSettings: (patch) =>
    set((state) =>
      updateActiveComposition(state, (composition) => ({
        ...composition,
        text: {
          ...composition.text,
          fontFamily: patch.fontFamily ?? composition.text.fontFamily,
          fontSize: patch.fontSize ?? composition.text.fontSize,
          position: patch.position ?? composition.text.position,
          overlay: {
            ...composition.text.overlay,
            enabled:
              patch.overlayEnabled ?? composition.text.overlay.enabled,
          },
        },
      })),
    ),

  updateImageSettings: (patch) =>
    set((state) =>
      updateActiveComposition(state, (composition) => ({
        ...composition,
        image: {
          ...composition.image,
          radius: patch.radius ?? composition.image.radius,
          shadow: patch.shadow ?? composition.image.shadow,
        },
      })),
    ),

  updateLayoutSettings: (patch) =>
    set((state) =>
      updateActiveComposition(state, (composition) => ({
        ...composition,
        layout: {
          ...composition.layout,
          spacing: patch.spacing ?? composition.layout.spacing,
        },
      })),
    ),

  deleteActiveComposition: () =>
    set((state) => {
      if (!state.activeComposition) return {};

      return withHistory(state, {
        ...toSnapshot(state),
        activeComposition: null,
      });
    }),

  clearCanvasContents: () =>
    set((state) =>
      withHistory(state, {
        ...toSnapshot(state),
        activeBackgroundId: DEFAULT_BACKGROUND_PRESET_ID,
        activeComposition: null,
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
