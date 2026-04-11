import { useEffect, useMemo, useState } from "react";
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

export type CreateSidebarTab = "page" | "image" | "background" | "text" | "effects" | "layers";

const createItemId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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

const getActiveCanvas = (state: EditorStateSnapshot) =>
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
  canvases: EditorCanvas[],
  removedCanvasId: string,
  activeCanvasId: string,
) => {
  if (canvases.length === 0) {
    return DEFAULT_CANVAS_ID;
  }

  if (removedCanvasId !== activeCanvasId) {
    return activeCanvasId;
  }

  const removedIndex = canvases.findIndex((canvas) => canvas.id === removedCanvasId);
  const fallbackIndex =
    removedIndex >= 0 ? Math.min(removedIndex, canvases.length - 2) : 0;

  return canvases[Math.max(fallbackIndex, 0)]?.id ?? canvases[0].id;
};

export const useCreateEditorState = () => {
  const [state, setState] = useState<EditorStateSnapshot>(() =>
    createEditorStateSnapshot(
      createEditorCanvas(DEFAULT_CANVAS_ID, DEFAULT_ASPECT_RATIO),
    ),
  );
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [paintColor, setPaintColor] = useState(
    state.canvases[0]?.document.bg.fill ?? "#ffffff",
  );
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<CreateSidebarTab>("page");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const updateState = (updater: (current: EditorStateSnapshot) => EditorStateSnapshot) =>
    setState((current) => updater(current));

  const activeCanvas = useMemo(() => getActiveCanvas(state), [state]);

  useEffect(() => {
    const nextPaintColor = normalizeHexColor(activeCanvas.document.bg.fill);

    setPaintColor((current) => (current === nextPaintColor ? current : nextPaintColor));
  }, [activeCanvas.document.bg.fill, activeCanvas.id]);

  const setActiveCanvas = (canvasId: string) =>
    updateState((current) => {
      if (!current.canvases.some((canvas) => canvas.id === canvasId)) {
        return current;
      }

      return {
        ...current,
        activeCanvasId: canvasId,
      };
    });

  const addCanvas = () =>
    updateState((current) => {
      const canvasId = createCanvasId(current.canvases);
      const ratio = getActiveCanvas(current).ratio;
      const nextCanvas = createEditorCanvas(canvasId, ratio);

      return {
        ...current,
        activeCanvasId: nextCanvas.id,
        canvases: [...current.canvases, nextCanvas],
      };
    });

  const removeCanvas = (canvasId: string) =>
    updateState((current) => {
      if (current.canvases.length <= 1) {
        return current;
      }

      const nextCanvases = current.canvases.filter((canvas) => canvas.id !== canvasId);

      if (nextCanvases.length === current.canvases.length) {
        return current;
      }

      return {
        ...current,
        activeCanvasId: getNextActiveCanvasId(
          current.canvases,
          canvasId,
          current.activeCanvasId,
        ),
        canvases: nextCanvases,
      };
    });

  const replaceCanvases = (canvases: EditorCanvas[], activeCanvasId: string) =>
    updateState((current) => {
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

      return {
        ...current,
        activeCanvasId: nextActiveCanvasId,
        canvases: nextCanvases,
      };
    });

  const setRatio = (ratio: AspectRatioPreset, canvasId = state.activeCanvasId) =>
    updateState((current) =>
      updateCanvasById(current, canvasId, (canvas) => ({
        ...canvas,
        ratio,
        document: cloneEditorDocument(canvas.document),
      })),
    );

  const setBackgroundFill = (fill: string, canvasId = state.activeCanvasId) =>
    updateState((current) => {
      const normalizedFill = normalizeHexColor(fill);

      const nextState = updateCanvasById(current, canvasId, (canvas) => ({
        ...canvas,
        document: {
          ...cloneEditorDocument(canvas.document),
          bg: {
            fill: normalizedFill,
          },
        },
      }));

      return nextState;
    });

  const addItem = (
    canvasId: string,
    payload: AssetDragPayload,
    point: CanvasPoint,
  ) =>
    updateState((current) =>
      updateCanvasById(current, canvasId, (canvas) => ({
        ...canvas,
        document: appendAsset(canvas, canvas.document, payload, point),
      })),
    );

  const replaceDocument = (canvasId: string, document: EditorDocument) =>
    updateState((current) => {
      const nextState = updateCanvasById(current, canvasId, (canvas) => ({
        ...canvas,
        document: cloneEditorDocument(document),
      }));

      return nextState;
    });

  const clearCanvas = (canvasId = state.activeCanvasId) =>
    updateState((current) =>
      updateCanvasById(current, canvasId, (canvas) => ({
        ...canvas,
        document: {
          ...cloneEditorDocument(canvas.document),
          items: [],
        },
      })),
    );

  const setSidebarWidthClamped = (nextWidth: number) =>
    setSidebarWidth(Math.min(560, Math.max(280, nextWidth)));

  return {
    activeCanvas,
    activeCanvasId: state.activeCanvasId,
    activeSidebarTab,
    activeTool,
    canvases: state.canvases,
    clearCanvas,
    isPreviewMode,
    isSidebarCollapsed,
    paintColor,
    addCanvas,
    addItem,
    removeCanvas,
    replaceCanvases,
    replaceDocument,
    setActiveCanvas,
    setActiveSidebarTab,
    setActiveTool,
    setBackgroundFill,
    setIsPreviewMode,
    setIsSidebarCollapsed,
    setPaintColor,
    setSidebarWidth: setSidebarWidthClamped,
    setRatio,
    sidebarWidth,
  };
};
