import {
  useActiveCanvasBackground,
  useCanvasImage,
  useCanvasImageIds,
  useCanvasShell,
} from "@/stores/useCanvasStore";
import { useAssetById } from "@/stores/useUploadLibraryStore";
import type { BoardImageItem } from "@/types/canvas";
import { useResolvedAssetMedia } from "@/uploads/media";

const formatImageDimensions = (image: BoardImageItem) => `${image.width} x ${image.height}`;

const OverviewImageItem = ({ imageId }: { imageId: string }) => {
  const image = useCanvasImage(imageId);
  const asset = useAssetById(image?.assetId ?? "");
  const media = useResolvedAssetMedia(image?.assetId, "preview");

  if (!image) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
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
        <p className="text-sm text-secondary-text">{formatImageDimensions(image)}</p>
      </div>
    </div>
  );
};

export const BoardOverviewPanel = () => {
  const canvasShell = useCanvasShell();
  const activeBackground = useActiveCanvasBackground();
  const imageIds = useCanvasImageIds();

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
        {imageIds.length ? (
          <div className="space-y-3">
            {imageIds.map((imageId) => (
              <OverviewImageItem key={imageId} imageId={imageId} />
            ))}
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
