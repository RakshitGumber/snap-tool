import { useEffect, useMemo } from "react";

import clsx from "clsx";

import { useEditorUiStore } from "@/stores/useEditorUiStore";
import {
  useActiveCanvasBackground,
  useCanvasShell,
  useCanvasStore,
} from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import type {
  BoardImageItem,
  BoardImagePositionPreset,
  BoardTextItem,
} from "@/types/canvas";

const formatImageDimensions = (image: BoardImageItem) => `${image.width} x ${image.height}`;

const truncateText = (value: string) =>
  value.length > 48 ? `${value.slice(0, 45).trimEnd()}...` : value;

const IMAGE_POSITION_PRESETS: Array<{
  id: BoardImagePositionPreset;
  label: string;
}> = [
  { id: "center", label: "Center" },
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
];

export const BoardOverviewPanel = () => {
  const canvasShell = useCanvasShell();
  const activeBackground = useActiveCanvasBackground();
  const imageOrder = useCanvasStore((state) => state.imageOrder);
  const imagesById = useCanvasStore((state) => state.imagesById);
  const textOrder = useCanvasStore((state) => state.textOrder);
  const textsById = useCanvasStore((state) => state.textsById);
  const assetMetaById = useUploadLibraryStore((state) => state.assetMetaById);
  const resolvedMediaByAssetId = useUploadLibraryStore(
    (state) => state.resolvedMediaByAssetId,
  );
  const resolveAssetMedia = useUploadLibraryStore((state) => state.resolveAssetMedia);
  const selectedImageId = useEditorUiStore((state) => state.selectedImageId);
  const selectImage = useEditorUiStore((state) => state.selectImage);
  const positionImageOnCanvas = useCanvasStore((state) => state.positionImageOnCanvas);
  const images = useMemo(
    () =>
      imageOrder
        .map((imageId) => imagesById[imageId])
        .filter((image): image is BoardImageItem => image !== undefined),
    [imageOrder, imagesById],
  );
  const texts = useMemo(
    () =>
      textOrder
        .map((textId) => textsById[textId])
        .filter((text): text is BoardTextItem => text !== undefined),
    [textOrder, textsById],
  );

  useEffect(() => {
    for (const image of images) {
      if (!resolvedMediaByAssetId[image.assetId]?.preview) {
        void resolveAssetMedia(image.assetId, "preview");
      }
    }
  }, [images, resolvedMediaByAssetId, resolveAssetMedia]);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-title-color">Background</h3>
        {canvasShell ? (
          <div className="space-y-1 text-sm text-secondary-text">
            <p className="text-title-color">{activeBackground?.label ?? "Unknown background"}</p>
            <p>{activeBackground?.kind ?? "custom"}</p>
          </div>
        ) : (
          <p className="text-sm text-secondary-text">No canvas selected.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-title-color">Images</h3>
        {images.length ? (
          <div className="space-y-3">
            {images.map((image) => {
              const asset = assetMetaById[image.assetId];
              const media = resolvedMediaByAssetId[image.assetId]?.preview;

              return (
                <div
                  key={image.id}
                  className={clsx(
                    "space-y-3 rounded-xl border px-3 py-3",
                    selectedImageId === image.id
                      ? "border-accent/70 bg-accent/5"
                      : "border-border-color/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectImage(image.id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    {media ? (
                      <img
                        src={media.src}
                        alt={image.alt}
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                        draggable={false}
                      />
                    ) : null}

                    <div className="min-w-0">
                      <p className="truncate text-sm text-title-color">
                        {asset?.name ?? image.alt ?? "Image"}
                      </p>
                      <p className="text-sm text-secondary-text">
                        {formatImageDimensions(image)}
                      </p>
                    </div>
                  </button>

                  <div className="flex flex-wrap gap-2">
                    {IMAGE_POSITION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          selectImage(image.id);
                          positionImageOnCanvas(image.id, preset.id);
                        }}
                        className="rounded-full border border-border-color/60 px-3 py-1 text-xs font-semibold text-title-color transition hover:border-accent/70 hover:text-accent"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-secondary-text">No images on this canvas.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-title-color">Text</h3>
        {texts.length ? (
          <div className="space-y-3">
            {texts.map((text) => (
              <div
                key={text.id}
                className="rounded-xl border border-border-color/40 px-3 py-3"
              >
                <p className="text-sm font-semibold text-title-color">
                  {truncateText(text.text)}
                </p>
                <p className="mt-1 text-sm text-secondary-text">
                  {text.fontFamily} · {text.fontSize}px · {text.align}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-secondary-text">No text on this canvas.</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-title-color">Effects / Filters</h3>
        <p className="text-sm text-secondary-text">No filters applied.</p>
      </section>
    </div>
  );
};
