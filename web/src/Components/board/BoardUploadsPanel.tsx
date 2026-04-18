import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import clsx from "clsx";

import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import { setDraggedAssetId } from "@/uploads/drag";

const SOURCE_LABELS = {
  "built-in": "Library",
  "local-file": "Local",
  "image-url": "Image URL",
  github: "GitHub",
  youtube: "YouTube",
} as const;

export const BoardUploadsPanel = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isDropActive, setIsDropActive] = useState(false);

  const assets = useUploadLibraryStore((state) => state.assets);
  const isHydrated = useUploadLibraryStore((state) => state.isHydrated);
  const isImporting = useUploadLibraryStore((state) => state.isImporting);
  const error = useUploadLibraryStore((state) => state.error);
  const hydrateLibrary = useUploadLibraryStore((state) => state.hydrateLibrary);
  const addLocalFiles = useUploadLibraryStore((state) => state.addLocalFiles);
  const importFromUrl = useUploadLibraryStore((state) => state.importFromUrl);
  const insertAssetOnActiveCanvas = useUploadLibraryStore(
    (state) => state.insertAssetOnActiveCanvas,
  );
  const clearError = useUploadLibraryStore((state) => state.clearError);

  useEffect(() => {
    if (isHydrated) return;
    void hydrateLibrary();
  }, [hydrateLibrary, isHydrated]);

  const insertAssets = (assetIds: string[]) => {
    assetIds.forEach((assetId) => {
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
              if (error) {
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
            disabled={isImporting}
            className="rounded-xl bg-title-color px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {isImporting ? "Importing" : "Import"}
          </button>
        </div>

        {error ? (
          <div className="mt-3 rounded-xl bg-[#FFE8E5] px-3 py-2 text-sm text-[#8A2F23]">
            {error}
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
              Click to insert, or drag an image onto a canvas.
            </p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-title-color outline outline-1 outline-border-color/60">
            {assets.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => (
            <button
              key={asset.id}
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
              className="overflow-hidden rounded-2xl text-left outline outline-1 outline-border-color/60 transition hover:-translate-y-0.5 hover:outline-accent/70"
            >
              <div className="aspect-square overflow-hidden bg-transparent p-2">
                <img
                  src={asset.thumbnailSrc}
                  alt={asset.name}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="space-y-1 px-3 py-3">
                <p className="truncate text-sm font-semibold text-title-color">{asset.name}</p>
                <p className="text-xs text-secondary-text">{SOURCE_LABELS[asset.source]}</p>
              </div>
            </button>
          ))}
        </div>

        {!assets.length ? (
          <div className="rounded-xl px-4 py-4 text-sm text-secondary-text">
            Your upload library will appear here.
          </div>
        ) : null}
      </div>
    </div>
  );
};
