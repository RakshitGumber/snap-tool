// Review note: Upload library panel for importing local files or URLs and inserting assets onto the canvas.
// The comments in this file are intentionally dense to support the requested review pass.

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import clsx from "clsx";

import { useEditorUiStore } from "@/stores/useEditorUiStore";
import { pushToast } from "@/stores/useToastStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import { clearDraggedAssetId, setDraggedAssetId } from "@/uploads/drag";

/**
 * Keeps source_labels in one named constant so related calculations stay consistent.
 */
const SOURCE_LABELS = {
  "built-in": "Library",
  "local-file": "Local",
  "image-url": "Image URL",
  github: "GitHub",
  youtube: "YouTube",
} as const;

/**
 * Renders upload/import controls and the asset library grid for canvas insertion.
 */
export const BoardUploadsPanel = () => {
  // Store mutable interaction state in a ref so pointer handlers can read it without re-rendering.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Keep this local UI state in React because it only affects the current component instance.
  const [isDropActive, setIsDropActive] = useState(false);

  const assetIds = useUploadLibraryStore((state) => state.assetOrder);
  // Select this store or hook value close to where the component uses it.
  const assetMetaById = useUploadLibraryStore((state) => state.assetMetaById);
  // Select this store or hook value close to where the component uses it.
  const resolvedMediaByAssetId = useUploadLibraryStore(
    (state) => state.resolvedMediaByAssetId,
  );
  // Select this store or hook value close to where the component uses it.
  const urlInput = useUploadLibraryStore((state) => state.urlInput);
  // Select this store or hook value close to where the component uses it.
  const status = useUploadLibraryStore((state) => state.status);
  // Select this store or hook value close to where the component uses it.
  const importStatus = useUploadLibraryStore((state) => state.importStatus);
  // Select this store or hook value close to where the component uses it.
  const lastError = useUploadLibraryStore((state) => state.lastError);
  // Select this store or hook value close to where the component uses it.
  const setOpenSectionId = useEditorUiStore((state) => state.setOpenSectionId);
  // Select this store or hook value close to where the component uses it.
  const setSidebarOpen = useEditorUiStore((state) => state.setSidebarOpen);
  // Select this store or hook value close to where the component uses it.
  const hydrateLibrary = useUploadLibraryStore((state) => state.hydrateLibrary);
  // Select this store or hook value close to where the component uses it.
  const addLocalFiles = useUploadLibraryStore((state) => state.addLocalFiles);
  // Select this store or hook value close to where the component uses it.
  const importFromUrl = useUploadLibraryStore((state) => state.importFromUrl);
  // Select this store or hook value close to where the component uses it.
  const insertAssetOnActiveCanvas = useUploadLibraryStore(
    (state) => state.insertAssetOnActiveCanvas,
  );
  // Select this store or hook value close to where the component uses it.
  const setUrlInput = useUploadLibraryStore((state) => state.setUrlInput);
  // Select this store or hook value close to where the component uses it.
  const resetUrlInput = useUploadLibraryStore((state) => state.resetUrlInput);
  // Select this store or hook value close to where the component uses it.
  const clearError = useUploadLibraryStore((state) => state.clearError);
  // Select this store or hook value close to where the component uses it.
  const resolveAssetMedia = useUploadLibraryStore(
    (state) => state.resolveAssetMedia,
  );

  useEffect(() => {
    // Keep this conditional branch explicit because it changes the user-visible editor behavior.
    if (status !== "idle") {
      // Return the resolved value to the caller after all guards and transformations.
      return;
    }

    void hydrateLibrary();
  }, [hydrateLibrary, status]);

  useEffect(() => {
    // Walk each item deliberately because order and accumulated state matter here.
    for (const assetId of assetIds) {
      // Guard this branch so missing or invalid state does not flow into the main path.
      if (!resolvedMediaByAssetId[assetId]?.preview) {
        void resolveAssetMedia(assetId, "preview");
      }
    }
  }, [assetIds, resolveAssetMedia, resolvedMediaByAssetId]);

  const returnToOverview = () => {
    setOpenSectionId("overview");
    setSidebarOpen(true);
  };

  const insertAssets = (nextAssetIds: string[]) => {
    nextAssetIds.forEach((assetId) => {
      insertAssetOnActiveCanvas(assetId);
    });

    if (nextAssetIds.length) {
      // Return the resolved value to the caller after all guards and transformations.
      returnToOverview();
    }
  };

  const handleFiles = async (files: File[]) => {
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (!files.length) {
      // Return the resolved value to the caller after all guards and transformations.
      return;
    }

    clearError();

    try {
      const addedAssets = await addLocalFiles(files);
      insertAssets(addedAssets.map((asset) => asset.id));
      pushToast({
        variant: "success",
        title: addedAssets.length === 1 ? "Image added" : "Images added",
        message:
          addedAssets.length === 1
            ? "Added 1 image to your library and canvas."
            : `Added ${addedAssets.length} images to your library and canvas.`,
      });
    } catch (error) {
      pushToast({
        variant: "error",
        title: "Import failed",
        message:
          error instanceof Error
            ? error.message
            : "Unable to import those files.",
      });
      // Return the resolved value to the caller after all guards and transformations.
      return;
    }
  };

  const handleFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    await handleFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleUrlImport = async () => {
    // Isolate fallible browser or storage work so failures can be reported without crashing the UI.
    try {
      const asset = await importFromUrl(urlInput);
      insertAssetOnActiveCanvas(asset.id);
      // Return the resolved value to the caller after all guards and transformations.
      returnToOverview();
      resetUrlInput();
      pushToast({
        variant: "success",
        title: "Asset imported",
        message: `Imported ${asset.name} and added it to the canvas.`,
      });
    } catch (error) {
      pushToast({
        variant: "error",
        title: "Import failed",
        message:
          error instanceof Error ? error.message : "Unable to import that URL.",
      });
      // Return the resolved value to the caller after all guards and transformations.
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
    <div className="space-y-4 font-sans">
      <div className="rounded-2xl p-4">
        <div className="space-y-3">
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
            <span className="text-sm font-semibold text-title-color">
              Drag and drop images
            </span>
            <span className="mt-1 text-xs">or click to browse local files</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4">
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(event) => {
              // Keep this conditional branch explicit because it changes the user-visible editor behavior.
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
          </div>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-title-color outline outline-border-color/60">
            {assetIds.length}
          </span>
        </div>

        <div className="max-h-105 overflow-auto rounded-2xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {assetIds.map((assetId) => {
              const asset = assetMetaById[assetId];
              // Guard this branch so missing or invalid state does not flow into the main path.
              if (!asset) {
                // Return null when this helper cannot produce a usable value.
                return null;
              }

              const media = resolvedMediaByAssetId[assetId]?.preview;

              return (
                <button
                  key={assetId}
                  type="button"
                  draggable
                  onClick={() => {
                    clearError();
                    insertAssetOnActiveCanvas(asset.id);
                    // Return the resolved value to the caller after all guards and transformations.
                    returnToOverview();
                  }}
                  onDragStart={(event) => {
                    clearError();
                    setDraggedAssetId(event.dataTransfer, asset.id);
                  }}
                  onDragEnd={clearDraggedAssetId}
                  className="overflow-hidden rounded-2xl text-left outline outline-border-color/60 transition hover:-translate-y-0.5 hover:outline-accent/70"
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
                    <p className="truncate text-sm font-semibold text-title-color">
                      {asset.name}
                    </p>
                    <p className="text-xs text-secondary-text">
                      {SOURCE_LABELS[asset.source]}
                    </p>
                  </div>
                </button>
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
