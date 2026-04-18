import { create } from "zustand";

import { useCanvasStore } from "@/stores/useCanvasStore";
import type { StoredUploadLibraryAsset, UploadLibraryAsset } from "@/types/uploads";
import {
  createLocalUploadAsset,
  loadImageDimensions,
  resolveAssetFromUrl,
} from "@/uploads/imports";
import { readStoredUploadAssets, saveStoredUploadAsset } from "@/uploads/storage";

type UploadLibraryState = {
  assets: UploadLibraryAsset[];
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

const BUILT_IN_ASSET_DEFINITIONS = [
  {
    id: "built-in-ferret",
    name: "Ferret",
    source: "built-in" as const,
    src: "/images/ferret.png",
    thumbnailSrc: "/images/ferret.png",
    storageKind: "bundled" as const,
  },
];

const sortAssets = (assets: UploadLibraryAsset[]) =>
  [...assets].sort((left, right) => {
    if (left.source === "built-in" && right.source !== "built-in") return -1;
    if (left.source !== "built-in" && right.source === "built-in") return 1;

    return right.addedAt.localeCompare(left.addedAt);
  });

const hydrateBuiltInAssets = async (): Promise<UploadLibraryAsset[]> =>
  Promise.all(
    BUILT_IN_ASSET_DEFINITIONS.map(async (asset) => {
      try {
        const { width, height } = await loadImageDimensions(asset.src);

        return {
          ...asset,
          width,
          height,
          addedAt: "1970-01-01T00:00:00.000Z",
        };
      } catch {
        return {
          ...asset,
          width: 1024,
          height: 1024,
          addedAt: "1970-01-01T00:00:00.000Z",
        };
      }
    }),
  );

const toRuntimeAsset = (asset: StoredUploadLibraryAsset): UploadLibraryAsset | null => {
  if (asset.storageKind === "indexeddb-blob") {
    if (!asset.blob) return null;

    const localUrl = URL.createObjectURL(asset.blob);

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

export const useUploadLibraryStore = create<UploadLibraryState & UploadLibraryActions>(
  (set, get) => ({
    assets: [],
    isHydrated: false,
    isImporting: false,
    error: null,

    hydrateLibrary: async () => {
      if (get().isHydrated) {
        return;
      }

      try {
        const [builtInAssets, storedAssets] = await Promise.all([
          hydrateBuiltInAssets(),
          readStoredUploadAssets(),
        ]);

        const runtimeAssets = storedAssets
          .map(toRuntimeAsset)
          .filter((asset): asset is UploadLibraryAsset => asset !== null);

        set({
          assets: sortAssets([...builtInAssets, ...runtimeAssets]),
          isHydrated: true,
          error: null,
        });
      } catch (error) {
        set({
          assets: await hydrateBuiltInAssets(),
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

      const nextAssets: UploadLibraryAsset[] = [];

      for (const file of imageFiles) {
        const createdAsset = await createLocalUploadAsset(file);
        await persistLocalAsset(createdAsset);

        nextAssets.push({
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
        });
      }

      set((state) => ({
        assets: sortAssets([...state.assets, ...nextAssets]),
        error: null,
      }));

      return nextAssets;
    },

    importFromUrl: async (input) => {
      set({ isImporting: true, error: null });

      try {
        const asset = await resolveAssetFromUrl(input);
        await persistRemoteAsset(asset);

        set((state) => ({
          assets: sortAssets([...state.assets, asset]),
          isImporting: false,
          error: null,
        }));

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
      const asset = get().assets.find((libraryAsset) => libraryAsset.id === assetId);
      if (!asset) return null;

      return useCanvasStore.getState().insertImageOnActiveCanvas(asset);
    },

    clearError: () => set({ error: null }),
  }),
);
