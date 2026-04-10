import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
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

type EffectsTab = "stickers" | "icons" | "paint" | "hierarchy";

interface EffectsMenuProps {
  activeCanvasId: string;
  activeTool: EditorTool;
  canvases: EditorCanvas[];
  paintColor: string;
  onCanvasSelect: (canvasId: string) => void;
  onActiveToolChange: (tool: EditorTool) => void;
  onPaintColorChange: (color: string) => void;
}

const isItemOutsideCanvas = (canvas: EditorCanvas, item: EditorCanvas["document"]["items"][number]) => {
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

export const EffectsMenu = ({
  activeCanvasId,
  activeTool,
  canvases,
  paintColor,
  onCanvasSelect,
  onActiveToolChange,
  onPaintColorChange,
}: EffectsMenuProps) => {
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<EffectsTab>("stickers");

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) {
        return;
      }

      let newWidth = event.clientX;

      if (newWidth < 240) newWidth = 240;
      if (newWidth > 520) newWidth = 520;

      setWidth(newWidth);
    };

    const handleDoubleClick = () => {
      setWidth(320);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = "auto";
    };

    document.addEventListener("dblclick", handleDoubleClick);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [isResizing]);

  const startResizing = () => {
    setIsResizing(true);
    document.body.style.userSelect = "none";
  };

  const assets = useMemo<EffectAsset[]>(() => {
    if (activeTab === "icons") {
      return ICON_ASSETS;
    }

    if (activeTab === "paint") {
      return [];
    }

    return STICKER_ASSETS;
  }, [activeTab]);

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

  return (
    <section
      style={{ width: `${width}px` }}
      className="relative flex h-full shrink-0 flex-col border-r border-border-color bg-bg/70"
    >
      <div className="flex items-start justify-between border-b border-border-color px-4 py-4">
        <div>
          <p className="font-styled text-xs font-semibold uppercase tracking-[0.3em] text-secondary-text">
            Effects
          </p>
          <h2 className="mt-2 text-lg font-semibold text-title-color">
            Drag onto canvas
          </h2>
        </div>

        <div className="rounded-full border border-border-color px-3 py-1 text-xs text-secondary-text">
          {width}px
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        {[
          { id: "stickers", label: "Stickers", icon: "solar:sticker-smile-circle-2-broken" },
          { id: "icons", label: "Icons", icon: "solar:widget-add-broken" },
          { id: "paint", label: "Paint", icon: "solar:paint-roller-broken" },
          { id: "hierarchy", label: "Layers", icon: "solar:list-check-broken" },
        ].map((tab) => {
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                selected
                  ? "bg-accent text-bg"
                  : "border border-border-color text-title-color hover:bg-accent-light"
              }`}
              onClick={() => setActiveTab(tab.id as EffectsTab)}
            >
              <Icon icon={tab.icon} className="text-base" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {activeTab === "paint" ? (
          <div className="space-y-4 rounded-3xl border border-border-color bg-bg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-title-color">Paint Bucket</h3>
                <p className="text-sm text-secondary-text">
                  Pick a color, then click the canvas.
                </p>
              </div>
              <button
                type="button"
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  activeTool === "paintBucket"
                    ? "bg-accent text-bg"
                    : "border border-border-color text-title-color hover:bg-accent-light"
                }`}
                onClick={() => onActiveToolChange("paintBucket")}
              >
                Arm Tool
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {PAINT_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={`h-12 rounded-2xl border transition ${
                    paintColor === swatch
                      ? "border-title-color ring-2 ring-accent"
                      : "border-border-color"
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

            <label className="flex items-center gap-3 rounded-2xl border border-border-color px-3 py-3 text-sm text-title-color">
              <span className="shrink-0">Custom</span>
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
          </div>
        ) : activeTab === "hierarchy" ? (
          <div className="space-y-4 rounded-3xl border border-border-color bg-bg p-4">
            <div>
              <h3 className="font-medium text-title-color">Hierarchy</h3>
              <p className="text-sm text-secondary-text">
                View all canvases and the elements inside them.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-border-color bg-bg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-title-color">Root</p>
                    <p className="text-sm text-secondary-text">
                      {hierarchy.rootItems.length} off-canvas elements
                    </p>
                  </div>

                  <div className="rounded-full border border-border-color px-2 py-1 text-xs text-secondary-text">
                    board
                  </div>
                </div>

                <div className="mt-3 space-y-2 border-t border-border-color/70 pt-3">
                  {hierarchy.rootItems.length === 0 ? (
                    <p className="text-sm text-secondary-text">No root elements yet.</p>
                  ) : (
                    hierarchy.rootItems.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex items-center justify-between rounded-xl bg-accent-light/20 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-title-color">{item.assetLabel}</p>
                          <p className="text-secondary-text capitalize">
                            {item.itemType} • Canvas {item.canvasIndex + 1}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="rounded-full border border-border-color px-2 py-1 text-xs text-secondary-text transition hover:border-accent hover:text-title-color"
                          onClick={() => onCanvasSelect(item.canvasId)}
                        >
                          Focus
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {hierarchy.canvasSections.map(({ canvas, index, insideItems }) => {
                const selected = canvas.id === activeCanvasId;

                return (
                  <div
                    key={canvas.id}
                    className={`rounded-2xl border p-3 transition ${
                      selected
                        ? "border-accent bg-accent-light/40"
                        : "border-border-color bg-bg"
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
                          {ASPECT_RATIO_DIMENSIONS[canvas.ratio].width} x{" "}
                          {ASPECT_RATIO_DIMENSIONS[canvas.ratio].height} px •{" "}
                          {insideItems.length} elements
                        </p>
                      </div>

                      <div className="rounded-full border border-border-color px-2 py-1 text-xs text-secondary-text">
                        {canvas.id}
                      </div>
                    </button>

                    <div className="mt-3 space-y-2 border-t border-border-color/70 pt-3">
                      {insideItems.length === 0 ? (
                        <p className="text-sm text-secondary-text">No elements yet.</p>
                      ) : (
                        insideItems.map((item, itemIndex) => {
                            const asset = findEffectAssetById(item.sourceId);

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between rounded-xl bg-accent-light/20 px-3 py-2 text-sm"
                              >
                                <div>
                                  <p className="font-medium text-title-color">
                                    {asset?.label ?? item.sourceId}
                                  </p>
                                  <p className="text-secondary-text capitalize">
                                    {item.type} • layer {itemIndex + 1}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className="rounded-full border border-border-color px-2 py-1 text-xs text-secondary-text transition hover:border-accent hover:text-title-color"
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
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                draggable
                className="group rounded-3xl border border-border-color bg-bg p-3 text-left transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
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
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-accent-light/60 p-4">
                  <img
                    src={asset.src}
                    alt=""
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                </div>
                <div className="mt-3">
                  <p className="font-medium text-title-color">{asset.label}</p>
                  <p className="text-sm text-secondary-text capitalize">{asset.kind}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-color px-4 py-3 text-sm text-secondary-text">
        {activeTab === "paint"
          ? "Canvas fill applies to the active canvas."
          : activeTab === "hierarchy"
            ? "Off-canvas elements appear under Root. Select a canvas in the tree to make it active."
            : "Dropped elements are placed exactly where you release them on the artboard."}
      </div>

      <div
        role="separator"
        aria-label="Resize effects panel"
        onMouseDown={startResizing}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize transition hover:bg-accent-light active:bg-accent"
      />
    </section>
  );
};
