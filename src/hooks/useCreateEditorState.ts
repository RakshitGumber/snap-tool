import { parseAsStringLiteral, useQueryStates } from "nuqs";
import {
  ASPECT_RATIO_PRESETS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DOCUMENT,
  type AspectRatioPreset,
  type AssetDragPayload,
  type EditorDocument,
  editorDocumentParser,
  findEffectAssetById,
  normalizeHexColor,
  type NormalizedCanvasPoint,
} from "@/libs/editorSchema";

const createItemId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const queryState = {
  ratio: parseAsStringLiteral(ASPECT_RATIO_PRESETS)
    .withDefault(DEFAULT_ASPECT_RATIO)
    .withOptions({
      history: "replace",
      clearOnDefault: false,
    }),
  doc: editorDocumentParser.withDefault(DEFAULT_DOCUMENT).withOptions({
    history: "replace",
    clearOnDefault: false,
  }),
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
  const [state, setState] = useQueryStates(queryState);

  const setRatio = (ratio: AspectRatioPreset) => void setState({ ratio });

  const setBackgroundFill = (fill: string) =>
    void setState((current) => ({
      doc: {
        ...current.doc,
        bg: {
          fill: normalizeHexColor(fill),
        },
      },
    }));

  const addItem = (payload: AssetDragPayload, point: NormalizedCanvasPoint) =>
    void setState((current) => ({
      doc: appendAsset(current.doc, payload, point),
    }));

  const replaceDocument = (document: EditorDocument) =>
    void setState({
      doc: document,
    });

  return {
    ratio: state.ratio,
    document: state.doc,
    setRatio,
    setBackgroundFill,
    addItem,
    replaceDocument,
  };
};
