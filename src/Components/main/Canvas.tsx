import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  createCanvasEditor,
  type CanvasEditor,
  type CanvasViewportState,
} from "@/libs/Canvas";
import {
  CANVAS_ASSET_MIME,
  type AspectRatioPreset,
  type AssetDragPayload,
  type EditorDocument,
  type EditorTool,
  isAssetDragPayload,
} from "@/libs/editorSchema";

interface CanvasProps {
  aspectRatio: AspectRatioPreset;
  document: EditorDocument;
  activeTool: EditorTool;
  paintColor: string;
  onDropAsset: (payload: AssetDragPayload, point: { x: number; y: number }) => void;
  onApplyPaint: (color: string) => void;
  onDocumentChange: (document: EditorDocument) => void;
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

export const Canvas = ({
  aspectRatio,
  document,
  activeTool,
  paintColor,
  onDropAsset,
  onApplyPaint,
  onDocumentChange,
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
      onDocumentChange,
      onViewportChange: setViewportState,
    }).then((editor) => {
      if (disposed) {
        editor.destroy();
        return;
      }

      editorRef.current = editor;
      editor.setAspectRatio(aspectRatio);
      editor.setDocument(document);
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
    editorRef.current?.setAspectRatio(aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    editorRef.current?.setTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    editorRef.current?.setDocument(document);
  }, [document]);

  return (
    <section className="min-h-0 flex-1 bg-[radial-gradient(circle_at_top,_rgba(76,251,149,0.12),_transparent_28%),linear-gradient(180deg,rgba(18,18,23,0.04),transparent)] p-5">
      <div
        className={`relative h-full overflow-hidden rounded-[36px] bg-bg/35 transition ${
          isDropActive
            ? "shadow-[0_0_0_4px_rgba(16,185,129,0.16),0_22px_64px_rgba(2,6,23,0.18)]"
            : "shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        }`}
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

          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
            setIsDropActive(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDropActive(false);

          const payload = parseDraggedAsset(event);
          const point = editorRef.current?.screenToCanvasPoint(
            event.clientX,
            event.clientY,
          );

          if (!payload || !point) {
            return;
          }

          onDropAsset(payload, point);
        }}
        onClick={(event) => {
          if (activeTool !== "paintBucket") {
            return;
          }

          const point = editorRef.current?.screenToCanvasPoint(
            event.clientX,
            event.clientY,
          );

          if (!point) {
            return;
          }

          onApplyPaint(paintColor);
        }}
      >
        <div ref={hostRef} className="h-full w-full" />

        {!isReady ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-bg/70 backdrop-blur-sm">
            <p className="font-styled text-sm uppercase tracking-[0.3em] text-secondary-text">
              Preparing editor
            </p>
          </div>
        ) : null}

        <div className="pointer-events-none absolute left-5 top-5 rounded-full bg-bg/85 px-3 py-2 text-xs uppercase tracking-[0.24em] text-secondary-text shadow-lg backdrop-blur-xl">
          {activeTool === "paintBucket"
            ? "Paint bucket armed"
            : "Wheel to zoom. Pan with middle-click or Shift plus left-drag."}
        </div>

        {viewportState.canReturnToCanvas ? (
          <button
            type="button"
            className="absolute bottom-5 right-5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg shadow-[0_18px_32px_rgba(16,185,129,0.28)] transition hover:brightness-105"
            onClick={(event) => {
              event.stopPropagation();
              editorRef.current?.centerCanvas();
            }}
          >
            Move Back To Canvas
          </button>
        ) : null}
      </div>
    </section>
  );
};
