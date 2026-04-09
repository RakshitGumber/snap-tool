import { useEffect, useState } from "react";
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DOCUMENT,
  type AspectRatioPreset,
  type AssetDragPayload,
  type EditorDocument,
  findEffectAssetById,
  isAspectRatioPreset,
  normalizeHexColor,
  type NormalizedCanvasPoint,
  parseEditorDocument,
  serializeEditorDocument,
} from "@/libs/editorSchema";

const createItemId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const RATIO_PARAM = "ratio";
const DOCUMENT_PARAM = "doc";

interface EditorSearchState {
  ratio: AspectRatioPreset;
  doc: EditorDocument;
}

const parseAspectRatio = (value: string | null) => {
  if (value && isAspectRatioPreset(value)) {
    return value;
  }

  return DEFAULT_ASPECT_RATIO;
};

const parseDocument = (value: string | null) =>
  value ? parseEditorDocument(value) ?? DEFAULT_DOCUMENT : DEFAULT_DOCUMENT;

const readSearchState = (): EditorSearchState => {
  const params = new URLSearchParams(window.location.search);

  return {
    ratio: parseAspectRatio(params.get(RATIO_PARAM)),
    doc: parseDocument(params.get(DOCUMENT_PARAM)),
  };
};

const writeSearchState = (state: EditorSearchState) => {
  const params = new URLSearchParams(window.location.search);

  params.set(RATIO_PARAM, state.ratio);
  params.set(DOCUMENT_PARAM, serializeEditorDocument(state.doc));

  const nextSearch = `?${params.toString()}`;

  if (nextSearch === window.location.search) {
    return;
  }

  window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}${window.location.hash}`);
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
    ...document,
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

export const useCreateEditorState = () => {
  const [state, setState] = useState<EditorSearchState>(() => readSearchState());

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

  const updateState = (updater: (current: EditorSearchState) => EditorSearchState) => {
    setState((current) => {
      const nextState = updater(current);

      writeSearchState(nextState);
      return nextState;
    });
  };

  const setRatio = (ratio: AspectRatioPreset) =>
    updateState((current) => ({
      ...current,
      ratio,
    }));

  const setBackgroundFill = (fill: string) =>
    updateState((current) => ({
      ...current,
      doc: {
        ...current.doc,
        bg: {
          fill: normalizeHexColor(fill),
        },
      },
    }));

  const addItem = (payload: AssetDragPayload, point: NormalizedCanvasPoint) =>
    updateState((current) => ({
      ...current,
      doc: appendAsset(current.doc, payload, point),
    }));

  const replaceDocument = (document: EditorDocument) =>
    updateState((current) => ({
      ...current,
      doc: document,
    }));

  return {
    ratio: state.ratio,
    document: state.doc,
    setRatio,
    setBackgroundFill,
    addItem,
    replaceDocument,
  };
};
