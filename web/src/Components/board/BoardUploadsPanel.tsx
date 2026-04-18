import {
  memo,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type UIEvent,
} from "react";

import clsx from "clsx";

import { useElementSize } from "@/libs/useElementSize";
import { useVirtualGrid } from "@/libs/useVirtualGrid";
import {
  useAssetById,
  useAssetIds,
  useUploadLibraryStore,
} from "@/stores/useUploadLibraryStore";
import { setDraggedAssetId } from "@/uploads/drag";
import { useResolvedAssetMedia } from "@/uploads/media";

const SOURCE_LABELS = {
  "built-in": "Library",
  "local-file": "Local",
  "image-url": "Image URL",
  github: "GitHub",
  youtube: "YouTube",
} as const;

const GRID_GAP = 12;
const CARD_MIN_WIDTH = 144;
const CARD_ROW_HEIGHT = 212;
const LIBRARY_HEIGHT = 420;

const UploadAssetCard = memo(({ assetId }: { assetId: string }) => {
  const asset = useAssetById(assetId);
  const media = useResolvedAssetMedia(assetId, "preview");
  const clearError = useUploadLibraryStore((state) => state.clearError);
  const insertAssetOnActiveCanvas = useUploadLibraryStore(
    (state) => state.insertAssetOnActiveCanvas,
  );

  if (!asset) {
    return null;
  }

  return (
    <button
      type="button"
      draggable
      onClick={() => {
        clearError();
        insertAssetOnActiveCanvas(asset.id);
      }}
      onDragStart={(event) => {
        clearError();
        setDraggedAssetId(event.dataTransfer, asset.id);
      }}
      className="h-full overflow-hidden rounded-2xl text-left outline outline-1 outline-border-color/60 transition hover:-translate-y-0.5 hover:outline-accent/70"
    >
      <div className="aspect-square overflow-hidden bg-transparent p-2">
        {media ? (
          <img
            src={media.src}
            alt={asset.name}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full rounded-xl bg-surface-3/70" />
        )}
      </div>
      <div className="space-y-1 px-3 py-3">
        <p className="truncate text-sm font-semibold text-title-color">{asset.name}</p>
        <p className="text-xs text-secondary-text">{SOURCE_LABELS[asset.source]}</p>
      </div>
    </button>
  );
});

UploadAssetCard.displayName = "UploadAssetCard";

export const BoardUploadsPanel = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const libraryViewportRef = useRef<HTMLDivElement | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isDropActive, setIsDropActive] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  const assetIds = useAssetIds();
  const deferredAssetIds = useDeferredValue(assetIds);
  const librarySize = useElementSize(libraryViewportRef);

  const status = useUploadLibraryStore((state) => state.status);
  const importStatus = useUploadLibraryStore((state) => state.importStatus);
  const lastError = useUploadLibraryStore((state) => state.lastError);
  const hydrateLibrary = useUploadLibraryStore((state) => state.hydrateLibrary);
  const addLocalFiles = useUploadLibraryStore((state) => state.addLocalFiles);
  const importFromUrl = useUploadLibraryStore((state) => state.importFromUrl);
  const insertAssetOnActiveCanvas = useUploadLibraryStore(
    (state) => state.insertAssetOnActiveCanvas,
  );
  const clearError = useUploadLibraryStore((state) => state.clearError);

  useEffect(() => {
    if (status !== "idle") return;
    void hydrateLibrary();
  }, [hydrateLibrary, status]);

  const insertAssets = (nextAssetIds: string[]) => {
    nextAssetIds.forEach((assetId) => {
      insertAssetOnActiveCanvas(assetId);
    });
  };

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;

    clearError();

    try {
      const addedAssets = await addLocalFiles(files);
      insertAssets(addedAssets.map((asset) => asset.id));
    } catch {
      return;
    }
  };

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await handleFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleUrlImport = async () => {
    try {
      const asset = await importFromUrl(urlInput);
      insertAssetOnActiveCanvas(asset.id);
      setUrlInput("");
    } catch {
      return;
    }
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDropActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDropActive(false);
  };

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDropActive(false);

    await handleFiles(Array.from(event.dataTransfer.files));
  };

  const columnCount = Math.max(
    1,
    Math.floor((Math.max(librarySize.width, CARD_MIN_WIDTH) + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)),
  );
  const visibleGrid = useVirtualGrid({
    itemCount: deferredAssetIds.length,
    containerHeight: librarySize.height || LIBRARY_HEIGHT,
    scrollTop,
    columnCount,
    rowHeight: CARD_ROW_HEIGHT,
  });
  const itemWidth = Math.max(
    CARD_MIN_WIDTH,
    Math.floor(
      (Math.max(librarySize.width, CARD_MIN_WIDTH) - GRID_GAP * (columnCount - 1)) / columnCount,
    ),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
              Local uploads
            </p>
            <p className="mt-1 text-sm text-secondary-text">
              Drop image files here. They stay on this device and are restored in this
              browser.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              clearError();
              fileInputRef.current?.click();
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
              "flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition",
              isDropActive
                ? "border-accent text-title-color"
                : "border-border-color/70 text-secondary-text hover:border-accent/70 hover:text-title-color",
            )}
          >
            <span className="text-sm font-semibold text-title-color">Drag and drop images</span>
            <span className="mt-1 text-xs">or click to browse local files</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
          Import from URL
        </p>
        <p className="mt-1 text-sm text-secondary-text">
          Paste a YouTube link, GitHub repository URL, or a direct image URL.
        </p>

        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(event) => {
              if (lastError) {
                clearError();
              }

              setUrlInput(event.target.value);
            }}
            placeholder="https://github.com/owner/repo"
            className="min-w-0 flex-1 rounded-xl border border-border-color/70 bg-card-bg px-3 py-2 text-sm text-title-color outline-none transition placeholder:text-secondary-text focus:border-accent"
          />
          <button
            type="button"
            onClick={handleUrlImport}
            disabled={importStatus === "running"}
            className="rounded-xl bg-title-color px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {importStatus === "running" ? "Importing" : "Import"}
          </button>
        </div>

        {lastError ? (
          <div className="mt-3 rounded-xl bg-[#FFE8E5] px-3 py-2 text-sm text-[#8A2F23]">
            {lastError}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
              Library
            </p>
            <p className="mt-1 text-sm text-secondary-text">
              Click to insert, or drag an image onto the canvas.
            </p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-title-color outline outline-1 outline-border-color/60">
            {assetIds.length}
          </span>
        </div>

        <div
          ref={libraryViewportRef}
          onScroll={(event: UIEvent<HTMLDivElement>) =>
            setScrollTop(event.currentTarget.scrollTop)
          }
          className="relative h-[420px] overflow-auto rounded-2xl"
        >
          <div
            className="relative"
            style={{
              height: visibleGrid.totalHeight || 0,
            }}
          >
            {visibleGrid.items.map((item) => {
              const assetId = deferredAssetIds[item.index];
              if (!assetId) {
                return null;
              }

              return (
                <div
                  key={assetId}
                  className="absolute"
                  style={{
                    width: itemWidth,
                    left: item.column * (itemWidth + GRID_GAP),
                    top: item.row * CARD_ROW_HEIGHT,
                    height: CARD_ROW_HEIGHT - GRID_GAP,
                  }}
                >
                  <UploadAssetCard assetId={assetId} />
                </div>
              );
            })}
          </div>
        </div>

        {!assetIds.length && status !== "hydrating" ? (
          <div className="rounded-xl px-4 py-4 text-sm text-secondary-text">
            Your upload library will appear here.
          </div>
        ) : null}

        {status === "hydrating" ? (
          <div className="rounded-xl px-4 py-4 text-sm text-secondary-text">
            Loading your upload library...
          </div>
        ) : null}
      </div>
    </div>
  );
};
