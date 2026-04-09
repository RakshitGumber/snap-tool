import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DOCUMENT,
  DEFAULT_CANVAS_ID,
  createEditorCanvas,
  createEditorStateSnapshot,
  type AspectRatioPreset,
  type AssetDragPayload,
  cloneEditorDocument,
  findEffectAssetById,
  isAspectRatioPreset,
  normalizeHexColor,
  type NormalizedCanvasPoint,
  parseEditorDocument,
  parseEditorStateSnapshot,
  resizeDocumentForAspectRatio,
  serializeEditorStateSnapshot,
  type EditorCanvas,
  type EditorDocument,
  type EditorStateSnapshot,
} from "@/libs/editorSchema";

const createItemId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const LEGACY_RATIO_PARAM = "ratio";
const LEGACY_DOCUMENT_PARAM = "doc";
const STATE_PARAM = "state";

const parseLegacyState = (params: URLSearchParams): EditorStateSnapshot => {
  const ratioValue = params.get(LEGACY_RATIO_PARAM);
  const documentValue = params.get(LEGACY_DOCUMENT_PARAM);
  const ratio =
    ratioValue && isAspectRatioPreset(ratioValue)
      ? ratioValue
      : DEFAULT_ASPECT_RATIO;
  const document = documentValue
    ? parseEditorDocument(documentValue) ?? DEFAULT_DOCUMENT
    : DEFAULT_DOCUMENT;

  return createEditorStateSnapshot(
    createEditorCanvas(DEFAULT_CANVAS_ID, ratio, document),
  );
};

const readSearchState = (): EditorStateSnapshot => {
  const params = new URLSearchParams(window.location.search);
  const stateValue = params.get(STATE_PARAM);

  if (stateValue) {
    return parseEditorStateSnapshot(stateValue) ?? createEditorStateSnapshot();
  }

  return parseLegacyState(params);
};

const writeSearchState = (state: EditorStateSnapshot) => {
  const params = new URLSearchParams(window.location.search);

  params.set(STATE_PARAM, serializeEditorStateSnapshot(state));
  params.delete(LEGACY_RATIO_PARAM);
  params.delete(LEGACY_DOCUMENT_PARAM);

  const nextSearch = `?${params.toString()}`;

  if (nextSearch === window.location.search) {
    return;
  }

  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${nextSearch}${window.location.hash}`,
  );
};

const appendAsset = (
  document: EditorDocument,
  payload: AssetDragPayload,
  point: NormalizedCanvasPoint,
) => {
  const asset = findEffectAssetById(payload.sourceId);

  if (!asset) {
    return document;
  }

  const nextZ =
    document.items.reduce((highest, item) => Math.max(highest, item.z), -1) + 1;
  const halfSize = asset.defaultSize / 2;
  const x = clamp(point.x, halfSize, 1 - halfSize);
  const y = clamp(point.y, halfSize, 1 - halfSize);

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

export const useCreateEditorState = () => {
  const [state, setState] = useState<EditorStateSnapshot>(() => readSearchState());

  useEffect(() => {
    writeSearchState(readSearchState());
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const nextState = readSearchState();

      writeSearchState(nextState);
      setState(nextState);
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const updateState = (updater: (current: EditorStateSnapshot) => EditorStateSnapshot) => {
    setState((current) => {
      const nextState = updater(current);

      writeSearchState(nextState);
      return nextState;
    });
  };

  const activeCanvas = useMemo(() => getActiveCanvas(state), [state]);

  const setActiveCanvas = (canvasId: string) =>
    updateState((current) =>
      current.canvases.some((canvas) => canvas.id === canvasId)
        ? {
            ...current,
            activeCanvasId: canvasId,
          }
        : current,
    );

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

  const setRatio = (ratio: AspectRatioPreset, canvasId = state.activeCanvasId) =>
    updateState((current) =>
      updateCanvasById(current, canvasId, (canvas) => ({
        ...canvas,
        ratio,
        document: resizeDocumentForAspectRatio(canvas.document, canvas.ratio, ratio),
      })),
    );

  const setBackgroundFill = (fill: string, canvasId = state.activeCanvasId) =>
    updateState((current) =>
      updateCanvasById(current, canvasId, (canvas) => ({
        ...canvas,
        document: {
          ...cloneEditorDocument(canvas.document),
          bg: {
            fill: normalizeHexColor(fill),
          },
        },
      })),
    );

  const addItem = (
    canvasId: string,
    payload: AssetDragPayload,
    point: NormalizedCanvasPoint,
  ) =>
    updateState((current) =>
      updateCanvasById(current, canvasId, (canvas) => ({
        ...canvas,
        document: appendAsset(canvas.document, payload, point),
      })),
    );

  const replaceDocument = (canvasId: string, document: EditorDocument) =>
    updateState((current) =>
      updateCanvasById(current, canvasId, (canvas) => ({
        ...canvas,
        document: cloneEditorDocument(document),
      })),
    );

  return {
    activeCanvas,
    activeCanvasId: state.activeCanvasId,
    canvases: state.canvases,
    addCanvas,
    addItem,
    replaceDocument,
    setActiveCanvas,
    setBackgroundFill,
    setRatio,
  };
};
