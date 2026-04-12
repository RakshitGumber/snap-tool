import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  createCanvasEditor,
  type CanvasEditor,
  type CanvasViewportState,
} from "@/libs/Canvas";
import {
  CANVAS_ASSET_MIME,
  type AssetDragPayload,
  type EditorCanvas,
  type EditorTool,
  isAssetDragPayload,
} from "@/libs/editorSchema";

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

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLElement && target.isContentEditable);

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
  const [isDropActive, setIsDropActive] = useState(false);
  const [viewportState, setViewportState] = useState<CanvasViewportState>({
    canReturnToCanvas: false,
  });

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    let disposed = false;

    void createCanvasEditor(host, {
      onActiveCanvasChange: onActivateCanvas,
      onCanvasesChange,
      onCanvasDelete: onDeleteCanvas,
      onDocumentChange,
      onViewportChange: setViewportState,
    }).then((editor) => {
      if (disposed) {
        editor.destroy();
        return;
      }

      editorRef.current = editor;
      editor.setCanvases(canvases);
      editor.setActiveCanvasId(activeCanvasId);
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
    editorRef.current?.setCanvases(canvases);
  }, [canvases]);

  useEffect(() => {
    editorRef.current?.setActiveCanvasId(activeCanvasId);
  }, [activeCanvasId]);

  useEffect(() => {
    editorRef.current?.setTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        editorRef.current?.deleteSelection();
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      if (event.code === "Period" || event.key === ".") {
        event.preventDefault();
        editorRef.current?.focusCanvas(activeCanvasId);
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        editorRef.current?.focusCanvasInDirection("right");
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        editorRef.current?.focusCanvasInDirection("left");
        return;
      }

      if (event.code === "ArrowDown") {
        event.preventDefault();
        editorRef.current?.focusCanvasInDirection("down");
        return;
      }

      if (event.code === "ArrowUp") {
        event.preventDefault();
        editorRef.current?.focusCanvasInDirection("up");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCanvasId]);

  return (
    <section className="h-full w-full">
      <div
        className="relative h-full overflow-hidden"
        onDragEnter={(event) => {
          if (hasAssetDragData(event)) {
            setIsDropActive(true);
          }
        }}
        onDragOver={(event) => {
          if (!hasAssetDragData(event)) {
            return;
          }

          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setIsDropActive(true);
        }}
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget;

          if (
            !(nextTarget instanceof Node) ||
            !event.currentTarget.contains(nextTarget)
          ) {
            setIsDropActive(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDropActive(false);

          const payload = parseDraggedAsset(event);
          const target = editorRef.current?.screenToCanvasPoint(
            event.clientX,
            event.clientY,
          );

          if (!payload || !target) {
            return;
          }

          onActivateCanvas(target.canvasId);
          onDropAsset(target.canvasId, payload, target.point);
        }}
        onClick={(event) => {
          if (activeTool !== "paintBucket") {
            return;
          }

          const target = editorRef.current?.screenToCanvasPoint(
            event.clientX,
            event.clientY,
          );

          if (!target) {
            return;
          }

          onActivateCanvas(target.canvasId);
          onApplyPaint(target.canvasId, paintColor);
        }}
      >
        <div ref={hostRef} className="h-full w-full" />

        {!isReady ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-bg/75 backdrop-blur-sm">
            <p className="font-comic text-sm uppercase tracking-[0.3em] text-secondary-text">
              Preparing editor
            </p>
          </div>
        ) : null}

        {viewportState.canReturnToCanvas ? (
          <button
            type="button"
            className="absolute bottom-5 right-5 rounded-full bg-title-color px-4 py-2 text-sm font-semibold text-bg shadow-[0_18px_32px_rgba(15,23,42,0.22)] transition hover:brightness-105"
            onClick={(event) => {
              event.stopPropagation();
              editorRef.current?.focusCanvas(activeCanvasId);
            }}
          >
            Recenter canvas
          </button>
        ) : null}
      </div>
    </section>
  );
};
