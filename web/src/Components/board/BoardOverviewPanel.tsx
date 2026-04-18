import { useActiveCanvas, useActiveCanvasBackground } from "@/stores/useCanvasStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import type { BoardImageItem } from "@/types/canvas";

const formatImageDimensions = (image: BoardImageItem) => `${image.width} x ${image.height}`;

export const BoardOverviewPanel = () => {
  const activeCanvas = useActiveCanvas();
  const activeBackground = useActiveCanvasBackground();
  const assetsById = useUploadLibraryStore((state) => state.assetsById);

  const canvasImages =
    activeCanvas?.imageOrder
      .map((imageId) => activeCanvas.imagesById[imageId])
      .filter((image): image is BoardImageItem => image !== undefined) ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-title-color">Background</h3>
        {activeCanvas ? (
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
        {canvasImages.length ? (
          <div className="space-y-3">
            {canvasImages.map((image) => {
              const asset = assetsById[image.assetId];

              return (
                <div key={image.id} className="flex items-center gap-3">
                  {asset ? (
                    <img
                      src={asset.thumbnailSrc}
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
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-secondary-text">No images on this canvas.</p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-title-color">Text</h3>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-title-color">Effects / Filters</h3>
        <p className="text-sm text-secondary-text">No filters applied.</p>
      </section>
    </div>
  );
};
