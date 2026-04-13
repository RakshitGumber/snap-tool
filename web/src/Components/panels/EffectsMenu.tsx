import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ASPECT_RATIO_DIMENSIONS,
  CANVAS_ASSET_MIME,
  ICON_ASSETS,
  PAINT_SWATCHES,
  STICKER_ASSETS,
  findEffectAssetById,
  type EditorCanvas,
  type EditorTool,
  type EffectAsset,
} from "@/libs/editorSchema";
import type { CreateSidebarTab } from "@/stores/useCreateEditorStore";

interface EffectsMenuProps {
  activeCanvasId: string;
  activeSidebarTab: CreateSidebarTab;
  activeTool: EditorTool;
  canvases: EditorCanvas[];
  paintColor: string;
  sidebarWidth: number;
  isCollapsed: boolean;
  onActiveSidebarTabChange: (tab: CreateSidebarTab) => void;
  onActiveToolChange: (tool: EditorTool) => void;
  onBackgroundFill: (fill: string, canvasId?: string) => void;
  onCanvasSelect: (canvasId: string) => void;
  onPaintColorChange: (color: string) => void;
  onSidebarWidthChange: (width: number) => void;
  onToggleCollapsed: () => void;
}

const PAGE_STYLES = [
  { label: "Paper", fill: "#f8f1de" },
  { label: "Sky", fill: "#dcefff" },
  { label: "Cherry", fill: "#ffe1e8" },
  { label: "Night", fill: "#121217" },
  { label: "Mint", fill: "#e0f8ef" },
  { label: "Cream", fill: "#fff9ef" },
];

const TEXT_STYLES = [
  { id: "bubble", label: "Bubble", sample: "Soft rounded captions" },
  { id: "comic", label: "Comic", sample: "Bold, playful headlines" },
  { id: "marker", label: "Marker", sample: "Hand-drawn notes" },
] as const;

const EFFECT_MOODS = [
  { id: "lift", label: "Lift", sample: "Lighter frame shadow" },
  { id: "grain", label: "Grain", sample: "Paper-forward surface" },
  { id: "snap", label: "Snap", sample: "Sharper edge rhythm" },
] as const;

const combinedAssets: EffectAsset[] = [...STICKER_ASSETS, ...ICON_ASSETS];

const isItemOutsideCanvas = (
  canvas: EditorCanvas,
  item: EditorCanvas["document"]["items"][number],
) => {
  const size = ASPECT_RATIO_DIMENSIONS[canvas.ratio];
  const halfWidth = item.w / 2;
  const halfHeight = item.h / 2;

  return (
    item.x - halfWidth < 0 ||
    item.y - halfHeight < 0 ||
    item.x + halfWidth > size.width ||
    item.y + halfHeight > size.height
  );
};

const clampSidebarWidth = (width: number) =>
  Math.min(560, Math.max(280, width));

const PanelCard = ({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="rounded-[28px] border border-border-color/70 bg-bg/92 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-[0.34em] text-secondary-text">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-comic text-[18px] font-bold text-title-color">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 text-sm text-secondary-text">{description}</p>
      ) : null}
    </div>
    {children}
  </section>
);

export const CreateSidebar = ({
  activeCanvasId,
  activeSidebarTab,
  activeTool,
  canvases,
  paintColor,
  sidebarWidth,
  isCollapsed,
  onActiveSidebarTabChange,
  onActiveToolChange,
  onBackgroundFill,
  onCanvasSelect,
  onPaintColorChange,
  onSidebarWidthChange,
  onToggleCollapsed,
}: EffectsMenuProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [textStyle, setTextStyle] = useState<
    (typeof TEXT_STYLES)[number]["id"]
  >(TEXT_STYLES[0].id);
  const [effectMood, setEffectMood] = useState<
    (typeof EFFECT_MOODS)[number]["id"]
  >(EFFECT_MOODS[0].id);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isResizing) {
        return;
      }

      onSidebarWidthChange(clampSidebarWidth(event.clientX));
    };

    const handlePointerUp = () => {
      if (!isResizing) {
        return;
      }

      setIsResizing(false);
      document.body.style.userSelect = "auto";
    };

    if (isResizing) {
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isResizing, onSidebarWidthChange]);

  const activeCanvas = useMemo(
    () =>
      canvases.find((canvas) => canvas.id === activeCanvasId) ??
      canvases[0] ??
      null,
    [activeCanvasId, canvases],
  );

  const hierarchy = useMemo(() => {
    const rootItems: Array<{
      assetLabel: string;
      canvasId: string;
      canvasIndex: number;
      itemId: string;
      itemType: string;
    }> = [];

    const canvasSections = canvases.map((canvas, index) => {
      const insideItems = canvas.document.items
        .slice()
        .sort((left, right) => left.z - right.z)
        .filter((item) => {
          const outside = isItemOutsideCanvas(canvas, item);

          if (outside) {
            const asset = findEffectAssetById(item.sourceId);

            rootItems.push({
              assetLabel: asset?.label ?? item.sourceId,
              canvasId: canvas.id,
              canvasIndex: index,
              itemId: item.id,
              itemType: item.type,
            });
          }

          return !outside;
        });

      return {
        canvas,
        index,
        insideItems,
      };
    });

    return {
      canvasSections,
      rootItems,
    };
  }, [canvases]);

  if (isCollapsed) {
    return (
      <aside className="hidden lg:flex lg:w-16 lg:shrink-0 lg:flex-col lg:border-r lg:border-border-color/70 lg:bg-bg/85 lg:backdrop-blur-xl">
        <button
          type="button"
          className="flex h-14 items-center justify-center border-b border-border-color/70 text-secondary-text transition hover:text-title-color"
          onClick={onToggleCollapsed}
          aria-label="Open studio panel"
        >
          <Icon icon="solar:panel-left-open-broken" className="text-xl" />
        </button>
        <div className="flex flex-1 items-center justify-center">
          <span
            style={{ writingMode: "vertical-rl" }}
            className="rotate-180 text-[10px] uppercase tracking-[0.36em] text-secondary-text"
          >
            Studio
          </span>
        </div>
      </aside>
    );
  }

  return (
    <motion.aside
      ref={rootRef}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
      className="relative flex h-[calc(100vh-64px)] shrink-0 flex-col border-b border-border-color/70 bg-bg backdrop-blur-xl lg:border-b-0 lg:border-r lg:w-(--sidebar-width)"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-color/60 px-4 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.34em] text-secondary-text">
            Create board
          </p>
          <h2 className="mt-2 font-comic text-[20px] font-bold text-title-color">
            Page, image, and frame controls
          </h2>
        </div>

        <button
          type="button"
          className="rounded-full border border-border-color/70 bg-bg px-2 py-2 text-secondary-text transition hover:border-title-color/30 hover:text-title-color"
          onClick={onToggleCollapsed}
          aria-label="Collapse studio panel"
        >
          <Icon icon="solar:panel-left-close-broken" className="text-lg" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-border-color/60 px-4 py-3">
        {[
          { id: "page", label: "Page", icon: "solar:document-add-broken" },
          { id: "image", label: "Image", icon: "solar:gallery-add-broken" },
          {
            id: "background",
            label: "Background",
            icon: "solar:pallete-2-broken",
          },
          { id: "text", label: "Text", icon: "solar:text-bold-circle-broken" },
          {
            id: "effects",
            label: "Effects",
            icon: "solar:magic-stick-3-broken",
          },
          { id: "layers", label: "Layers", icon: "solar:list-check-broken" },
        ].map((tab) => {
          const selected = activeSidebarTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-[10px] uppercase tracking-[0.24em] transition ${
                selected
                  ? "bg-title-color text-bg shadow-[0_12px_22px_rgba(15,23,42,0.14)]"
                  : "border border-border-color/70 bg-bg/90 text-title-color hover:border-title-color/30"
              }`}
              onClick={() =>
                onActiveSidebarTabChange(tab.id as CreateSidebarTab)
              }
            >
              <Icon icon={tab.icon} className="text-base" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <PanelCard
          eyebrow="Page"
          title="Quick styles"
          description="Set the active canvas mood before you place anything."
        >
          <div className="grid grid-cols-2 gap-2">
            {PAGE_STYLES.map((style) => {
              const selected = activeCanvas?.document.bg.fill === style.fill;

              return (
                <button
                  key={style.label}
                  type="button"
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    selected
                      ? "border-title-color bg-title-color text-bg shadow-[0_14px_24px_rgba(15,23,42,0.14)]"
                      : "border-border-color/70 bg-bg/90 text-title-color hover:border-title-color/30"
                  }`}
                  onClick={() => onBackgroundFill(style.fill)}
                >
                  <span className="block text-sm font-semibold">
                    {style.label}
                  </span>
                  <span
                    className={selected ? "text-bg/70" : "text-secondary-text"}
                  >
                    {style.fill}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            {canvases.map((canvas, index) => {
              const selected = canvas.id === activeCanvasId;

              return (
                <button
                  key={canvas.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                    selected
                      ? "border-title-color bg-accent-light/40"
                      : "border-border-color/70 bg-bg/90 hover:border-title-color/25"
                  }`}
                  onClick={() => onCanvasSelect(canvas.id)}
                >
                  <div>
                    <p className="font-medium text-title-color">{`Canvas ${index + 1}`}</p>
                    <p className="text-sm text-secondary-text">
                      {ASPECT_RATIO_DIMENSIONS[canvas.ratio].width} x{" "}
                      {ASPECT_RATIO_DIMENSIONS[canvas.ratio].height}
                    </p>
                  </div>
                  <span className="rounded-full border border-border-color/70 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-secondary-text">
                    {canvas.id}
                  </span>
                </button>
              );
            })}
          </div>
        </PanelCard>

        <AnimatePresence mode="wait">
          {activeSidebarTab === "image" ? (
            <motion.div
              key="image"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <PanelCard
                eyebrow="Image"
                title="Drag art assets"
                description="Combined sticker and icon library, ready to drop onto the canvas."
              >
                <div className="grid grid-cols-2 gap-3">
                  {combinedAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      draggable
                      className="group rounded-[22px] border border-border-color/70 bg-bg p-3 text-left transition hover:-translate-y-0.5 hover:border-title-color/30 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
                      onDragStart={(event) => {
                        const payload = JSON.stringify({
                          type: asset.kind,
                          sourceId: asset.id,
                        });

                        event.dataTransfer.effectAllowed = "copy";
                        event.dataTransfer.setData(CANVAS_ASSET_MIME, payload);
                        event.dataTransfer.setData("text/plain", asset.label);
                      }}
                    >
                      <div className="flex aspect-square items-center justify-center rounded-[18px] bg-accent-light/55 p-4">
                        <img
                          src={asset.src}
                          alt=""
                          className="h-full w-full object-contain"
                          draggable={false}
                        />
                      </div>
                      <div className="mt-3">
                        <p className="font-medium text-title-color">
                          {asset.label}
                        </p>
                        <p className="text-sm uppercase tracking-[0.18em] text-secondary-text">
                          {asset.kind}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </PanelCard>
            </motion.div>
          ) : null}

          {activeSidebarTab === "background" ? (
            <motion.div
              key="background"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <PanelCard
                eyebrow="Background"
                title="Fill and arm paint"
                description="Pick a color, then apply it to the active canvas."
              >
                <div className="grid grid-cols-3 gap-2">
                  {PAINT_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      className={`h-12 rounded-2xl border transition ${
                        paintColor === swatch
                          ? "border-title-color ring-2 ring-title-color/30"
                          : "border-border-color/70"
                      }`}
                      style={{ backgroundColor: swatch }}
                      aria-label={`Use ${swatch} on canvas`}
                      onClick={() => {
                        onPaintColorChange(swatch);
                        onActiveToolChange("paintBucket");
                      }}
                    />
                  ))}
                </div>

                <label className="mt-4 flex items-center gap-3 rounded-2xl border border-border-color/70 bg-bg px-3 py-3 text-sm text-title-color">
                  <span className="shrink-0 uppercase tracking-[0.2em] text-secondary-text">
                    Custom
                  </span>
                  <input
                    type="color"
                    value={paintColor}
                    className="h-10 w-full cursor-pointer rounded-xl border-0 bg-transparent"
                    onChange={(event) => {
                      onPaintColorChange(event.target.value);
                      onActiveToolChange("paintBucket");
                    }}
                  />
                </label>

                <button
                  type="button"
                  className={`mt-4 w-full rounded-2xl border px-3 py-3 text-[11px] uppercase tracking-[0.22em] transition ${
                    activeTool === "paintBucket"
                      ? "border-title-color bg-title-color text-bg"
                      : "border-border-color/70 text-title-color hover:border-title-color/30"
                  }`}
                  onClick={() => onActiveToolChange("paintBucket")}
                >
                  Arm paint bucket
                </button>
              </PanelCard>
            </motion.div>
          ) : null}

          {activeSidebarTab === "text" ? (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <PanelCard
                eyebrow="Text"
                title="Typography lane"
                description="Text layers are not wired yet, so this slot keeps style references handy."
              >
                <div className="space-y-2">
                  {TEXT_STYLES.map((preset) => {
                    const selected = textStyle === preset.id;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                          selected
                            ? "border-title-color bg-accent-light/35"
                            : "border-border-color/70 bg-bg/90 hover:border-title-color/30"
                        }`}
                        onClick={() => setTextStyle(preset.id)}
                      >
                        <span className="block font-comic text-base font-bold text-title-color">
                          {preset.label}
                        </span>
                        <span className="text-sm text-secondary-text">
                          {preset.sample}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PanelCard>
            </motion.div>
          ) : null}

          {activeSidebarTab === "effects" ? (
            <motion.div
              key="effects"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <PanelCard
                eyebrow="Effects"
                title="Frame mood"
                description="Quick visual notes for the board frame and future effects passes."
              >
                <div className="space-y-2">
                  {EFFECT_MOODS.map((preset) => {
                    const selected = effectMood === preset.id;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                          selected
                            ? "border-title-color bg-title-color text-bg"
                            : "border-border-color/70 bg-bg/90 hover:border-title-color/30"
                        }`}
                        onClick={() => setEffectMood(preset.id)}
                      >
                        <span className="block font-medium">
                          {preset.label}
                        </span>
                        <span
                          className={
                            selected ? "text-bg/70" : "text-secondary-text"
                          }
                        >
                          {preset.sample}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PanelCard>
            </motion.div>
          ) : null}

          {activeSidebarTab === "layers" ? (
            <motion.div
              key="layers"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <PanelCard
                eyebrow="Layers"
                title="Hierarchy"
                description="Canvas order plus anything that drifted outside the frame."
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border-color/70 bg-bg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-title-color">Root</p>
                        <p className="text-sm text-secondary-text">
                          {hierarchy.rootItems.length} off-canvas elements
                        </p>
                      </div>
                      <span className="rounded-full border border-border-color/70 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-secondary-text">
                        board
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-border-color/60 pt-3">
                      {hierarchy.rootItems.length === 0 ? (
                        <p className="text-sm text-secondary-text">
                          No root elements yet.
                        </p>
                      ) : (
                        hierarchy.rootItems.map((item) => (
                          <div
                            key={item.itemId}
                            className="flex items-center justify-between rounded-2xl bg-accent-light/20 px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium text-title-color">
                                {item.assetLabel}
                              </p>
                              <p className="text-secondary-text">
                                {item.itemType} • Canvas {item.canvasIndex + 1}
                              </p>
                            </div>

                            <button
                              type="button"
                              className="rounded-full border border-border-color/70 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-secondary-text transition hover:border-title-color/30 hover:text-title-color"
                              onClick={() => onCanvasSelect(item.canvasId)}
                            >
                              Focus
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {hierarchy.canvasSections.map(
                    ({ canvas, index, insideItems }) => {
                      const selected = canvas.id === activeCanvasId;

                      return (
                        <div
                          key={canvas.id}
                          className={`rounded-2xl border p-3 transition ${
                            selected
                              ? "border-title-color bg-accent-light/30"
                              : "border-border-color/70 bg-bg"
                          }`}
                        >
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 text-left"
                            onClick={() => onCanvasSelect(canvas.id)}
                          >
                            <div>
                              <p className="font-medium text-title-color">{`Canvas ${index + 1}`}</p>
                              <p className="text-sm text-secondary-text">
                                {insideItems.length} elements
                              </p>
                            </div>

                            <span className="rounded-full border border-border-color/70 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-secondary-text">
                              {canvas.id}
                            </span>
                          </button>

                          <div className="mt-3 space-y-2 border-t border-border-color/60 pt-3">
                            {insideItems.length === 0 ? (
                              <p className="text-sm text-secondary-text">
                                No elements yet.
                              </p>
                            ) : (
                              insideItems.map((item, itemIndex) => {
                                const asset = findEffectAssetById(
                                  item.sourceId,
                                );

                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-2xl bg-accent-light/20 px-3 py-2 text-sm"
                                  >
                                    <div>
                                      <p className="font-medium text-title-color">
                                        {asset?.label ?? item.sourceId}
                                      </p>
                                      <p className="text-secondary-text">
                                        {item.type} • layer {itemIndex + 1}
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      className="rounded-full border border-border-color/70 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-secondary-text transition hover:border-title-color/30 hover:text-title-color"
                                      onClick={() => onCanvasSelect(canvas.id)}
                                    >
                                      Focus
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </PanelCard>
            </motion.div>
          ) : null}

          {activeSidebarTab === "page" ? (
            <motion.div
              key="page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <PanelCard
                eyebrow="Page"
                title="Frame shortcuts"
                description="Jump straight into the board mood and keep the canvas stack tidy."
              >
                <div className="grid grid-cols-3 gap-2">
                  {PAGE_STYLES.slice(0, 6).map((style) => (
                    <button
                      key={`page-${style.label}`}
                      type="button"
                      className="rounded-2xl border border-border-color/70 px-3 py-3 text-left transition hover:border-title-color/30"
                      onClick={() => onBackgroundFill(style.fill)}
                    >
                      <span className="block text-sm font-semibold text-title-color">
                        {style.label}
                      </span>
                      <span className="text-secondary-text">{style.fill}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-border-color/70 bg-bg px-3 py-3">
                  <div>
                    <p className="font-medium text-title-color">
                      Active canvas
                    </p>
                    <p className="text-sm text-secondary-text">
                      {activeCanvas
                        ? `Canvas ${canvases.findIndex((canvas) => canvas.id === activeCanvas.id) + 1}`
                        : "None"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-border-color/70 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-secondary-text transition hover:border-title-color/30 hover:text-title-color"
                    onClick={() => onActiveSidebarTabChange("layers")}
                  >
                    View stack
                  </button>
                </div>
              </PanelCard>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        role="separator"
        aria-label="Resize studio panel"
        onPointerDown={() => {
          setIsResizing(true);
          document.body.style.userSelect = "none";
        }}
        className="absolute right-0 top-0 hidden h-full w-1 cursor-col-resize bg-transparent transition hover:bg-title-color/10 active:bg-title-color/20 lg:block"
      />
    </motion.aside>
  );
};

export const EffectsMenu = CreateSidebar;
