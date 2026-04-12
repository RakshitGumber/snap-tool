import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyBindings";
import {
  createCanvasEditor,
  type CanvasEditor,
  type CanvasViewportState,
} from "@/libs/Canvas";
import { CanvasShortcuts } from "@/libs/canvasShorcuts";
import {
  CANVAS_ASSET_MIME,
  type AssetDragPayload,
  type EditorCanvas,
  type EditorTool,
  isAssetDragPayload,
} from "@/libs/editorSchema";
import type { ShortcutMap } from "@/types/canvas";

interface CanvasProps {
  activeCanvasId: string;
  activeTool: EditorTool;
  canvases: EditorCanvas[];
  paintColor: string;
  onActivateCanvas: (canvasId: string) => void;
  onApplyPaint: (canvasId: string, color: string) => void;
  onCanvasesChange: (canvases: EditorCanvas[], activeCanvasId: string) => void;
  onDeleteCanvas: (canvasId: string) => void;
  onDocumentChange: (
    canvasId: string,
    document: EditorCanvas["document"],
  ) => void;
  onDropAsset: (
    canvasId: string,
    payload: AssetDragPayload,
    point: { x: number; y: number },
  ) => void;
}

const parseDraggedAsset = (event: DragEvent<HTMLDivElement>) => {
  const rawPayload = event.dataTransfer.getData(CANVAS_ASSET_MIME);

  if (!rawPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawPayload);

    return isAssetDragPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const hasAssetDragData = (event: DragEvent<HTMLDivElement>) =>
  Array.from(event.dataTransfer.types).includes(CANVAS_ASSET_MIME);

const normalizeShortcutKey = (shortcut: string) =>
  shortcut
    .split("+")
    .map((segment) => {
      const normalized = segment.trim().toLowerCase();

      return normalized === "period" ? "." : normalized;
    })
    .join("+");

const normalizeShortcutMap = (shortcuts: ShortcutMap) =>
  Object.entries(shortcuts).reduce<ShortcutMap>(
    (normalized, [shortcut, handler]) => {
      normalized[normalizeShortcutKey(shortcut)] = handler;
      return normalized;
    },
    {},
  );

const noop = () => {};

export const Canvas = ({
  activeCanvasId,
  activeTool,
  canvases,
  paintColor,
  onActivateCanvas,
  onApplyPaint,
  onCanvasesChange,
  onDeleteCanvas,
  onDocumentChange,
  onDropAsset,
}: CanvasProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<CanvasEditor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [viewportState, setViewportState] = useState<CanvasViewportState>({
    canReturnToCanvas: false,
  });
  const callbackRef = useRef({
    onActivateCanvas,
    onApplyPaint,
    onCanvasesChange,
    onDeleteCanvas,
    onDocumentChange,
    onDropAsset,
  });
  const stateRef = useRef({
    activeCanvasId,
    activeTool,
    canvases,
  });
  callbackRef.current = {
    onActivateCanvas,
    onApplyPaint,
    onCanvasesChange,
    onDeleteCanvas,
    onDocumentChange,
    onDropAsset,
  };
  stateRef.current = {
    activeCanvasId,
    activeTool,
    canvases,
  };
  const keyboardShortcuts = useMemo(
    () =>
      normalizeShortcutMap(
        CanvasShortcuts({
          undo: noop,
          redo: noop,
          delete: () => {
            editorRef.current?.deleteSelection();
          },
          save: noop,
          clear: noop,
          focus: {
            this: () => {
              editorRef.current?.focusActiveCanvas();
            },
            next: () => {
              editorRef.current?.focusCanvasInDirection("right");
            },
            prev: () => {
              editorRef.current?.focusCanvasInDirection("left");
            },
            down: () => {
              editorRef.current?.focusCanvasInDirection("down");
            },
            up: () => {
              editorRef.current?.focusCanvasInDirection("up");
            },
          },
        }),
      ),
    [],
  );

  useKeyboardShortcuts(keyboardShortcuts, isReady);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    let disposed = false;

    void createCanvasEditor(host, {
      onActiveCanvasChange: (canvasId) =>
        callbackRef.current.onActivateCanvas(canvasId),
      onAssetDrop: (canvasId, payload, point) =>
        callbackRef.current.onDropAsset(canvasId, payload, point),
      onCanvasesChange: (nextCanvases, nextActiveCanvasId) =>
        callbackRef.current.onCanvasesChange(nextCanvases, nextActiveCanvasId),
      onCanvasDelete: (canvasId) =>
        callbackRef.current.onDeleteCanvas(canvasId),
      onDocumentChange: (canvasId, document) =>
        callbackRef.current.onDocumentChange(canvasId, document),
      onPaintApply: (canvasId, color) =>
        callbackRef.current.onApplyPaint(canvasId, color),
      onViewportChange: setViewportState,
    }).then((editor) => {
      if (disposed) {
        editor.destroy();
        return;
      }

      editorRef.current = editor;
      const initialState = stateRef.current;

      editor.syncState({
        activeCanvasId: initialState.activeCanvasId,
        canvases: initialState.canvases,
        tool: initialState.activeTool,
      });
      setIsReady(true);
    });

    return () => {
      disposed = true;
      setIsReady(false);
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    editorRef.current?.syncState({
      activeCanvasId,
      canvases,
      tool: activeTool,
    });
  }, [activeCanvasId, activeTool, canvases]);

  return (
    <section className="h-full w-full">
      <div
        className="relative h-full overflow-hidden"
        onDragOver={(event) => {
          if (!hasAssetDragData(event)) {
            return;
          }

          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          if (!hasAssetDragData(event)) {
            return;
          }

          event.preventDefault();

          const payload = parseDraggedAsset(event);

          if (!payload) {
            return;
          }

          editorRef.current?.dropAssetFromScreenPoint(
            event.clientX,
            event.clientY,
            payload,
          );
        }}
        onClick={(event) => {
          if (activeTool !== "paintBucket") {
            return;
          }

          editorRef.current?.paintFromScreenPoint(
            event.clientX,
            event.clientY,
            paintColor,
          );
        }}
      >
        <div ref={hostRef} className="h-screen w-screen" />
        {viewportState.canReturnToCanvas ? (
          <button
            type="button"
            className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-card-bg px-4 py-3 text-sm font-semibold text-text-color"
            onClick={(event) => {
              event.stopPropagation();
              editorRef.current?.focusActiveCanvas();
            }}
          >
            Recenter
          </button>
        ) : null}
      </div>
    </section>
  );
};
