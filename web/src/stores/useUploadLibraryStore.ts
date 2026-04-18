import { create } from "zustand";

import { useCanvasStore } from "@/stores/useCanvasStore";
import type { StoredUploadLibraryAsset, UploadLibraryAsset } from "@/types/uploads";
import { createLocalUploadAsset, resolveAssetFromUrl } from "@/uploads/imports";
import { readStoredUploadAssets, saveStoredUploadAsset } from "@/uploads/storage";

type UploadLibraryState = {
  assetOrder: string[];
  assetsById: Record<string, UploadLibraryAsset>;
  isHydrated: boolean;
  isImporting: boolean;
  error: string | null;
};

type UploadLibraryActions = {
  hydrateLibrary: () => Promise<void>;
  addLocalFiles: (files: File[]) => Promise<UploadLibraryAsset[]>;
  importFromUrl: (input: string) => Promise<UploadLibraryAsset>;
  insertAssetOnActiveCanvas: (assetId: string) => string | null;
  clearError: () => void;
};

const BUILT_IN_ASSET_DEFINITIONS: UploadLibraryAsset[] = [
  {
    id: "built-in-ferret",
    name: "Ferret",
    source: "built-in",
    src: "/images/ferret.png",
    thumbnailSrc: "/images/ferret.png",
    storageKind: "bundled",
    width: 2000,
    height: 1480,
    addedAt: "1970-01-01T00:00:00.000Z",
  },
];

const MAX_FILE_IMPORT_CONCURRENCY = 4;
const runtimeAssetUrls = new Map<string, string>();

const sortAssets = (assets: UploadLibraryAsset[]) =>
  [...assets].sort((left, right) => {
    if (left.source === "built-in" && right.source !== "built-in") return -1;
    if (left.source !== "built-in" && right.source === "built-in") return 1;

    return right.addedAt.localeCompare(left.addedAt);
  });

const toNormalizedAssets = (assets: UploadLibraryAsset[]) => ({
  assetOrder: assets.map((asset) => asset.id),
  assetsById: Object.fromEntries(assets.map((asset) => [asset.id, asset])),
});

const trackRuntimeAssetUrl = (assetId: string, url: string) => {
  const previousUrl = runtimeAssetUrls.get(assetId);
  if (previousUrl && previousUrl !== url) {
    URL.revokeObjectURL(previousUrl);
  }

  runtimeAssetUrls.set(assetId, url);
};

const clearRuntimeAssetUrls = () => {
  for (const url of runtimeAssetUrls.values()) {
    URL.revokeObjectURL(url);
  }

  runtimeAssetUrls.clear();
};

const toRuntimeAsset = (asset: StoredUploadLibraryAsset): UploadLibraryAsset | null => {
  if (asset.storageKind === "indexeddb-blob") {
    if (!asset.blob) return null;

    const localUrl = URL.createObjectURL(asset.blob);
    trackRuntimeAssetUrl(asset.id, localUrl);

    return {
      ...asset,
      src: localUrl,
      thumbnailSrc: localUrl,
    };
  }

  const src = asset.src ?? asset.thumbnailSrc;
  if (!src) return null;

  return {
    ...asset,
    src,
    thumbnailSrc: asset.thumbnailSrc ?? src,
  };
};

const persistLocalAsset = async (asset: Awaited<ReturnType<typeof createLocalUploadAsset>>) => {
  await saveStoredUploadAsset({
    id: asset.id,
    name: asset.name,
    source: asset.source,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    addedAt: asset.addedAt,
    storageKind: asset.storageKind,
    blob: asset.blob,
  });
};

const persistRemoteAsset = async (asset: UploadLibraryAsset) => {
  await saveStoredUploadAsset({
    id: asset.id,
    name: asset.name,
    source: asset.source,
    src: asset.src,
    thumbnailSrc: asset.thumbnailSrc,
    originalUrl: asset.originalUrl,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    addedAt: asset.addedAt,
    storageKind: asset.storageKind,
  });
};

const isSupportedImageFile = (file: File) =>
  file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);

const mapWithConcurrency = async <TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput) => Promise<TOutput>,
) => {
  const results: TOutput[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", clearRuntimeAssetUrls);
}

export const useUploadLibraryStore = create<UploadLibraryState & UploadLibraryActions>(
  (set, get) => ({
    assetOrder: [],
    assetsById: {},
    isHydrated: false,
    isImporting: false,
    error: null,

    hydrateLibrary: async () => {
      if (get().isHydrated) {
        return;
      }

      try {
        const storedAssets = await readStoredUploadAssets();
        clearRuntimeAssetUrls();

        const runtimeAssets = storedAssets
          .map(toRuntimeAsset)
          .filter((asset): asset is UploadLibraryAsset => asset !== null);
        const nextAssets = sortAssets([...BUILT_IN_ASSET_DEFINITIONS, ...runtimeAssets]);

        set({
          ...toNormalizedAssets(nextAssets),
          isHydrated: true,
          error: null,
        });
      } catch (error) {
        set({
          ...toNormalizedAssets(BUILT_IN_ASSET_DEFINITIONS),
          isHydrated: true,
          error:
            error instanceof Error
              ? error.message
              : "Unable to restore your upload library.",
        });
      }
    },

    addLocalFiles: async (files) => {
      const imageFiles = files.filter(isSupportedImageFile);

      if (!imageFiles.length) {
        const error = "Add at least one image file.";
        set({ error });
        throw new Error(error);
      }

      const nextAssets = await mapWithConcurrency(
        imageFiles,
        MAX_FILE_IMPORT_CONCURRENCY,
        async (file) => {
          const createdAsset = await createLocalUploadAsset(file);
          await persistLocalAsset(createdAsset);
          trackRuntimeAssetUrl(createdAsset.id, createdAsset.src);

          return {
            id: createdAsset.id,
            name: createdAsset.name,
            source: createdAsset.source,
            src: createdAsset.src,
            thumbnailSrc: createdAsset.thumbnailSrc,
            mimeType: createdAsset.mimeType,
            width: createdAsset.width,
            height: createdAsset.height,
            addedAt: createdAsset.addedAt,
            storageKind: createdAsset.storageKind,
          } satisfies UploadLibraryAsset;
        },
      );

      set((state) => {
        const currentAssets = state.assetOrder
          .map((assetId) => state.assetsById[assetId])
          .filter((asset): asset is UploadLibraryAsset => asset !== undefined);
        const mergedAssets = sortAssets([...currentAssets, ...nextAssets]);

        return {
          ...toNormalizedAssets(mergedAssets),
          error: null,
        };
      });

      return nextAssets;
    },

    importFromUrl: async (input) => {
      set({ isImporting: true, error: null });

      try {
        const asset = await resolveAssetFromUrl(input);
        await persistRemoteAsset(asset);

        set((state) => {
          const currentAssets = state.assetOrder
            .map((assetId) => state.assetsById[assetId])
            .filter((currentAsset): currentAsset is UploadLibraryAsset => currentAsset !== undefined);
          const mergedAssets = sortAssets([...currentAssets, asset]);

          return {
            ...toNormalizedAssets(mergedAssets),
            isImporting: false,
            error: null,
          };
        });

        return asset;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to import that URL.";

        set({
          isImporting: false,
          error: message,
        });

        throw error instanceof Error ? error : new Error(message);
      }
    },

    insertAssetOnActiveCanvas: (assetId) => {
      const asset = get().assetsById[assetId];
      if (!asset) return null;

      return useCanvasStore.getState().insertImageOnActiveCanvas(asset);
    },

    clearError: () => set({ error: null }),
  }),
);

export const useAssetIds = () =>
  useUploadLibraryStore((state) => state.assetOrder);

export const useAssetById = (assetId: string) =>
  useUploadLibraryStore((state) => state.assetsById[assetId] ?? null);
