import { create } from "zustand";
import {
  ASPECT_RATIO_DIMENSIONS,
  type CanvasPoint,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_CANVAS_ID,
  createEditorCanvas,
  createEditorStateSnapshot,
  type AspectRatioPreset,
  type AssetDragPayload,
  cloneEditorDocument,
  findEffectAssetById,
  normalizeHexColor,
  type EditorCanvas,
  type EditorDocument,
  type EditorStateSnapshot,
  type EditorTool,
} from "@/libs/editorSchema";

export type CreateSidebarTab =
  | "page"
  | "image"
  | "background"
  | "text"
  | "effects"
  | "layers";

type ToggleValue = boolean | ((current: boolean) => boolean);

interface CreateEditorStoreData {
  activeCanvasId: string;
  activeSidebarTab: CreateSidebarTab;
  activeTool: EditorTool;
  canvases: EditorCanvas[];
  isPreviewMode: boolean;
  isSidebarCollapsed: boolean;
  paintColor: string;
  sidebarWidth: number;
}

interface CreateEditorStoreActions {
  addCanvas: () => void;
  addItem: (canvasId: string, payload: AssetDragPayload, point: CanvasPoint) => void;
  clearCanvas: (canvasId?: string) => void;
  removeCanvas: (canvasId: string) => void;
  replaceCanvases: (canvases: EditorCanvas[], activeCanvasId: string) => void;
  replaceDocument: (canvasId: string, document: EditorDocument) => void;
  setActiveCanvas: (canvasId: string) => void;
  setActiveSidebarTab: (tab: CreateSidebarTab) => void;
  setActiveTool: (tool: EditorTool) => void;
  setBackgroundFill: (fill: string, canvasId?: string) => void;
  setIsPreviewMode: (value: ToggleValue) => void;
  setIsSidebarCollapsed: (value: ToggleValue) => void;
  setPaintColor: (color: string) => void;
  setRatio: (ratio: AspectRatioPreset, canvasId?: string) => void;
  setSidebarWidth: (width: number) => void;
}

export type CreateEditorStore = CreateEditorStoreData & CreateEditorStoreActions;

const createItemId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const clampSidebarWidth = (width: number) => Math.min(560, Math.max(280, width));

const resolveToggleValue = (value: ToggleValue, current: boolean) =>
  typeof value === "function" ? value(current) : value;

const appendAsset = (
  canvas: EditorCanvas,
  document: EditorDocument,
  payload: AssetDragPayload,
  point: CanvasPoint,
) => {
  const asset = findEffectAssetById(payload.sourceId);

  if (!asset) {
    return document;
  }

  const canvasSize = ASPECT_RATIO_DIMENSIONS[canvas.ratio];
  const nextZ =
    document.items.reduce((highest, item) => Math.max(highest, item.z), -1) + 1;
  const halfSize = asset.defaultSize / 2;
  const x = clamp(point.x, halfSize, canvasSize.width - halfSize);
  const y = clamp(point.y, halfSize, canvasSize.height - halfSize);

  return {
    ...cloneEditorDocument(document),
    items: [
      ...document.items,
      {
        id: createItemId(),
        type: payload.type,
        sourceId: payload.sourceId,
        x,
        y,
        w: asset.defaultSize,
        h: asset.defaultSize,
        rotation: 0,
        z: nextZ,
      },
    ],
  };
};

const updateCanvasById = (
  state: EditorStateSnapshot,
  canvasId: string,
  updater: (canvas: EditorCanvas) => EditorCanvas,
): EditorStateSnapshot => ({
  ...state,
  canvases: state.canvases.map((canvas) =>
    canvas.id === canvasId ? updater(canvas) : canvas,
  ),
});

const getActiveCanvas = (state: Pick<CreateEditorStoreData, "activeCanvasId" | "canvases">) =>
  state.canvases.find((canvas) => canvas.id === state.activeCanvasId) ??
  state.canvases[0] ??
  createEditorCanvas(DEFAULT_CANVAS_ID);

const createCanvasId = (canvases: EditorCanvas[]) => {
  const existing = new Set(canvases.map((canvas) => canvas.id));
  let index = canvases.length + 1;

  while (existing.has(`canvas-${index}`)) {
    index += 1;
  }

  return `canvas-${index}`;
};

const getNextActiveCanvasId = (
  previousCanvases: EditorCanvas[],
  nextCanvases: EditorCanvas[],
  removedCanvasId: string,
  activeCanvasId: string,
) => {
  if (nextCanvases.length === 0) {
    return DEFAULT_CANVAS_ID;
  }

  if (removedCanvasId !== activeCanvasId) {
    return activeCanvasId;
  }

  const removedIndex = previousCanvases.findIndex(
    (canvas) => canvas.id === removedCanvasId,
  );
  const fallbackIndex =
    removedIndex >= 0 ? Math.min(removedIndex, nextCanvases.length - 1) : 0;

  return nextCanvases[Math.max(fallbackIndex, 0)]?.id ?? nextCanvases[0].id;
};

const toSnapshot = (
  state: Pick<CreateEditorStoreData, "activeCanvasId" | "canvases">,
): EditorStateSnapshot => ({
  v: 2,
  activeCanvasId: state.activeCanvasId,
  canvases: state.canvases,
});

const fromSnapshot = (snapshot: EditorStateSnapshot): Pick<CreateEditorStoreData, "activeCanvasId" | "canvases"> => ({
  activeCanvasId: snapshot.activeCanvasId,
  canvases: snapshot.canvases,
});

const syncPaintColor = (state: CreateEditorStoreData): CreateEditorStoreData => ({
  ...state,
  paintColor: normalizeHexColor(getActiveCanvas(state).document.bg.fill),
});

const initialSnapshot = createEditorStateSnapshot(
  createEditorCanvas(DEFAULT_CANVAS_ID, DEFAULT_ASPECT_RATIO),
);

const initialState = syncPaintColor({
  ...fromSnapshot(initialSnapshot),
  activeSidebarTab: "page",
  activeTool: "select",
  isPreviewMode: false,
  isSidebarCollapsed: false,
  paintColor: "#ffffff",
  sidebarWidth: 360,
});

export const useCreateEditorStore = create<CreateEditorStore>()((set) => ({
  ...initialState,

  setActiveCanvas: (canvasId) =>
    set((current) => {
      if (!current.canvases.some((canvas) => canvas.id === canvasId)) {
        return current;
      }

      return syncPaintColor({
        ...current,
        activeCanvasId: canvasId,
      });
    }),

  addCanvas: () =>
    set((current) => {
      const canvasId = createCanvasId(current.canvases);
      const ratio = getActiveCanvas(current).ratio;
      const nextCanvas = createEditorCanvas(canvasId, ratio);

      return syncPaintColor({
        ...current,
        activeCanvasId: nextCanvas.id,
        canvases: [...current.canvases, nextCanvas],
      });
    }),

  removeCanvas: (canvasId) =>
    set((current) => {
      if (current.canvases.length <= 1) {
        return current;
      }

      const nextCanvases = current.canvases.filter((canvas) => canvas.id !== canvasId);

      if (nextCanvases.length === current.canvases.length) {
        return current;
      }

      return syncPaintColor({
        ...current,
        activeCanvasId: getNextActiveCanvasId(
          current.canvases,
          nextCanvases,
          canvasId,
          current.activeCanvasId,
        ),
        canvases: nextCanvases,
      });
    }),

  replaceCanvases: (canvases, activeCanvasId) =>
    set((current) => {
      if (canvases.length === 0) {
        return current;
      }

      const nextCanvases = canvases.map((canvas) => ({
        ...canvas,
        document: cloneEditorDocument(canvas.document),
      }));
      const nextActiveCanvasId = nextCanvases.some((canvas) => canvas.id === activeCanvasId)
        ? activeCanvasId
        : nextCanvases[0].id;

      return syncPaintColor({
        ...current,
        activeCanvasId: nextActiveCanvasId,
        canvases: nextCanvases,
      });
    }),

  setRatio: (ratio, canvasId) =>
    set((current) => {
      const targetCanvasId = canvasId ?? current.activeCanvasId;
      const nextSnapshot = updateCanvasById(
        toSnapshot(current),
        targetCanvasId,
        (canvas) => ({
          ...canvas,
          ratio,
          document: cloneEditorDocument(canvas.document),
        }),
      );

      return syncPaintColor({
        ...current,
        ...fromSnapshot(nextSnapshot),
      });
    }),

  setBackgroundFill: (fill, canvasId) =>
    set((current) => {
      const targetCanvasId = canvasId ?? current.activeCanvasId;
      const normalizedFill = normalizeHexColor(fill);
      const nextSnapshot = updateCanvasById(
        toSnapshot(current),
        targetCanvasId,
        (canvas) => ({
          ...canvas,
          document: {
            ...cloneEditorDocument(canvas.document),
            bg: {
              fill: normalizedFill,
            },
          },
        }),
      );

      return syncPaintColor({
        ...current,
        ...fromSnapshot(nextSnapshot),
      });
    }),

  addItem: (canvasId, payload, point) =>
    set((current) => {
      const nextSnapshot = updateCanvasById(toSnapshot(current), canvasId, (canvas) => ({
        ...canvas,
        document: appendAsset(canvas, canvas.document, payload, point),
      }));

      return {
        ...current,
        ...fromSnapshot(nextSnapshot),
      };
    }),

  replaceDocument: (canvasId, document) =>
    set((current) => {
      const nextSnapshot = updateCanvasById(toSnapshot(current), canvasId, (canvas) => ({
        ...canvas,
        document: cloneEditorDocument(document),
      }));

      return syncPaintColor({
        ...current,
        ...fromSnapshot(nextSnapshot),
      });
    }),

  clearCanvas: (canvasId) =>
    set((current) => {
      const targetCanvasId = canvasId ?? current.activeCanvasId;
      const nextSnapshot = updateCanvasById(
        toSnapshot(current),
        targetCanvasId,
        (canvas) => ({
          ...canvas,
          document: {
            ...cloneEditorDocument(canvas.document),
            items: [],
          },
        }),
      );

      return {
        ...current,
        ...fromSnapshot(nextSnapshot),
      };
    }),

  setActiveSidebarTab: (activeSidebarTab) => set({ activeSidebarTab }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setIsPreviewMode: (value) =>
    set((current) => ({
      isPreviewMode: resolveToggleValue(value, current.isPreviewMode),
    })),
  setIsSidebarCollapsed: (value) =>
    set((current) => ({
      isSidebarCollapsed: resolveToggleValue(value, current.isSidebarCollapsed),
    })),
  setPaintColor: (paintColor) => set({ paintColor: normalizeHexColor(paintColor) }),
  setSidebarWidth: (sidebarWidth) =>
    set({ sidebarWidth: clampSidebarWidth(sidebarWidth) }),
}));
