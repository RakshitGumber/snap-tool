import { create } from "zustand";

import { useCanvasStore } from "@/stores/useCanvasStore";
import type {
  StoredUploadAssetMeta,
  UploadAssetMediaVariant,
  UploadLibraryAssetMeta,
  UploadResolvedAssetMedia,
} from "@/types/uploads";
import { createLocalUploadAsset, resolveAssetFromUrl } from "@/uploads/imports";
import {
  readStoredUploadAssetBinary,
  readStoredUploadAssetMeta,
  saveStoredUploadAssetBinary,
  saveStoredUploadAssetMeta,
} from "@/uploads/storage";

type UploadLibraryState = {
  assetOrder: string[];
  assetMetaById: Record<string, UploadLibraryAssetMeta>;
  resolvedMediaByAssetId: Record<
    string,
    Partial<Record<UploadAssetMediaVariant, UploadResolvedAssetMedia>>
  >;
  urlInput: string;
  status: "idle" | "hydrating" | "ready" | "error";
  importStatus: "idle" | "running" | "error";
  lastError: string | null;
};

type UploadLibraryActions = {
  hydrateLibrary: () => Promise<void>;
  addLocalFiles: (files: File[]) => Promise<UploadLibraryAssetMeta[]>;
  importFromUrl: (input: string) => Promise<UploadLibraryAssetMeta>;
  insertAssetOnActiveCanvas: (assetId: string) => string | null;
  setUrlInput: (value: string) => void;
  resetUrlInput: () => void;
  resolveAssetMedia: (
    assetId: string,
    variant: UploadAssetMediaVariant,
  ) => Promise<UploadResolvedAssetMedia | null>;
  clearError: () => void;
};

const BUILT_IN_ASSET_DEFINITIONS: UploadLibraryAssetMeta[] = [
  {
    id: "built-in-ferret",
    name: "Ferret",
    source: "built-in",
    previewUrl: "/images/ferret.png",
    remoteUrl: "/images/ferret.png",
    storageKind: "bundled",
    width: 2000,
    height: 1480,
    addedAt: "1970-01-01T00:00:00.000Z",
  },
];

const MAX_FILE_IMPORT_CONCURRENCY = 4;
const runtimeAssetUrls = new Map<string, string>();
const mediaPromises = new Map<string, Promise<UploadResolvedAssetMedia | null>>();
let hydrationPromise: Promise<void> | null = null;

const sortAssets = (assets: UploadLibraryAssetMeta[]) =>
  [...assets].sort((left, right) => {
    if (left.source === "built-in" && right.source !== "built-in") return -1;
    if (left.source !== "built-in" && right.source === "built-in") return 1;

    return right.addedAt.localeCompare(left.addedAt);
  });

const toNormalizedAssets = (assets: UploadLibraryAssetMeta[]) => ({
  assetOrder: assets.map((asset) => asset.id),
  assetMetaById: Object.fromEntries(assets.map((asset) => [asset.id, asset])),
});

const mergeBuiltInAndStoredAssets = (storedAssets: StoredUploadAssetMeta[]) => {
  const byId = new Map<string, UploadLibraryAssetMeta>();

  for (const asset of BUILT_IN_ASSET_DEFINITIONS) {
    byId.set(asset.id, asset);
  }

  for (const asset of storedAssets) {
    byId.set(asset.id, asset);
  }

  return sortAssets([...byId.values()]);
};

const getMediaCacheKey = (assetId: string, variant: UploadAssetMediaVariant) =>
  `${assetId}:${variant}`;

const trackRuntimeAssetUrl = (cacheKey: string, url: string) => {
  const previousUrl = runtimeAssetUrls.get(cacheKey);
  if (previousUrl && previousUrl !== url) {
    URL.revokeObjectURL(previousUrl);
  }

  runtimeAssetUrls.set(cacheKey, url);
};

const clearRuntimeAssetUrls = () => {
  for (const url of runtimeAssetUrls.values()) {
    URL.revokeObjectURL(url);
  }

  runtimeAssetUrls.clear();
};

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

const isSupportedImageFile = (file: File) =>
  file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);

const setResolvedMediaState = ({
  assetId,
  variant,
  src,
  set,
}: {
  assetId: string;
  variant: UploadAssetMediaVariant;
  src: string;
  set: (
    updater:
      | Partial<UploadLibraryState>
      | ((state: UploadLibraryState) => Partial<UploadLibraryState>),
  ) => void;
}) => {
  set((state) => ({
    resolvedMediaByAssetId: {
      ...state.resolvedMediaByAssetId,
      [assetId]: {
        ...state.resolvedMediaByAssetId[assetId],
        [variant]: {
          assetId,
          variant,
          src,
        },
      },
    },
  }));
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", clearRuntimeAssetUrls);
}

export const useUploadLibraryStore = create<UploadLibraryState & UploadLibraryActions>(
  (set, get) => ({
    assetOrder: [],
    assetMetaById: {},
    resolvedMediaByAssetId: {},
    urlInput: "",
    status: "idle",
    importStatus: "idle",
    lastError: null,

    hydrateLibrary: async () => {
      if (get().status === "ready") {
        return;
      }

      if (hydrationPromise) {
        return hydrationPromise;
      }

      set({
        status: "hydrating",
        lastError: null,
      });

      hydrationPromise = (async () => {
        try {
          const storedAssets = await readStoredUploadAssetMeta();
          const nextAssets = mergeBuiltInAndStoredAssets(storedAssets);

          set({
            ...toNormalizedAssets(nextAssets),
            status: "ready",
            lastError: null,
          });
        } catch (error) {
          set({
            ...toNormalizedAssets(BUILT_IN_ASSET_DEFINITIONS),
            status: "error",
            lastError:
              error instanceof Error
                ? error.message
                : "Unable to restore your upload library.",
          });
        } finally {
          hydrationPromise = null;
        }
      })();

      return hydrationPromise;
    },

    addLocalFiles: async (files) => {
      const imageFiles = files.filter(isSupportedImageFile);

      if (!imageFiles.length) {
        const error = "Add at least one image file.";
        set({ lastError: error });
        throw new Error(error);
      }

      const createdAssets = await mapWithConcurrency(
        imageFiles,
        MAX_FILE_IMPORT_CONCURRENCY,
        async (file) => {
          const createdAsset = await createLocalUploadAsset(file);

          await saveStoredUploadAssetMeta(createdAsset.meta);
          await saveStoredUploadAssetBinary({
            id: `${createdAsset.meta.id}:full`,
            assetId: createdAsset.meta.id,
            variant: "full",
            mimeType: createdAsset.meta.mimeType,
            blob: createdAsset.originalBlob,
          });
          await saveStoredUploadAssetBinary({
            id: `${createdAsset.meta.id}:preview`,
            assetId: createdAsset.meta.id,
            variant: "preview",
            mimeType: createdAsset.previewMimeType,
            blob: createdAsset.previewBlob,
          });

          return createdAsset;
        },
      );

      const nextMeta = createdAssets.map((asset) => asset.meta);

      set((state) => {
        const currentAssets = state.assetOrder
          .map((assetId) => state.assetMetaById[assetId])
          .filter((asset): asset is UploadLibraryAssetMeta => asset !== undefined);
        const mergedAssets = sortAssets([...currentAssets, ...nextMeta]);

        return {
          ...toNormalizedAssets(mergedAssets),
          lastError: null,
          status: state.status === "idle" ? "ready" : state.status,
        };
      });

      for (const createdAsset of createdAssets) {
        const previewUrl = URL.createObjectURL(createdAsset.previewBlob);
        const fullUrl = URL.createObjectURL(createdAsset.originalBlob);

        trackRuntimeAssetUrl(getMediaCacheKey(createdAsset.meta.id, "preview"), previewUrl);
        trackRuntimeAssetUrl(getMediaCacheKey(createdAsset.meta.id, "full"), fullUrl);

        setResolvedMediaState({
          assetId: createdAsset.meta.id,
          variant: "preview",
          src: previewUrl,
          set,
        });
        setResolvedMediaState({
          assetId: createdAsset.meta.id,
          variant: "full",
          src: fullUrl,
          set,
        });
      }

      return nextMeta;
    },

    importFromUrl: async (input) => {
      set({
        importStatus: "running",
        lastError: null,
      });

      try {
        const asset = await resolveAssetFromUrl(input);
        await saveStoredUploadAssetMeta(asset);

        set((state) => {
          const currentAssets = state.assetOrder
            .map((assetId) => state.assetMetaById[assetId])
            .filter((currentAsset): currentAsset is UploadLibraryAssetMeta => currentAsset !== undefined);
          const mergedAssets = sortAssets([...currentAssets, asset]);

          return {
            ...toNormalizedAssets(mergedAssets),
            urlInput: "",
            importStatus: "idle",
            lastError: null,
            status: state.status === "idle" ? "ready" : state.status,
          };
        });

        return asset;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to import that URL.";

        set({
          importStatus: "error",
          lastError: message,
        });

        throw error instanceof Error ? error : new Error(message);
      }
    },

    insertAssetOnActiveCanvas: (assetId) => {
      const asset = get().assetMetaById[assetId];
      if (!asset) return null;

      return useCanvasStore.getState().insertImageOnActiveCanvas(asset);
    },

    setUrlInput: (urlInput) => set({ urlInput }),

    resetUrlInput: () => set({ urlInput: "" }),

    resolveAssetMedia: async (assetId, variant) => {
      const cached = get().resolvedMediaByAssetId[assetId]?.[variant];
      if (cached) {
        return cached;
      }

      const promiseKey = getMediaCacheKey(assetId, variant);
      const existingPromise = mediaPromises.get(promiseKey);
      if (existingPromise) {
        return existingPromise;
      }

      const asset = get().assetMetaById[assetId];
      if (!asset) {
        return null;
      }

      const nextPromise = (async () => {
        try {
          if (asset.storageKind === "bundled" || asset.storageKind === "remote-url") {
            const src =
              variant === "preview"
                ? asset.previewUrl ?? asset.remoteUrl
                : asset.remoteUrl ?? asset.previewUrl;
            if (!src) {
              return null;
            }

            setResolvedMediaState({
              assetId,
              variant,
              src,
              set,
            });

            return {
              assetId,
              variant,
              src,
            } satisfies UploadResolvedAssetMedia;
          }

          const binary =
            (await readStoredUploadAssetBinary(assetId, variant)) ??
            (variant === "preview"
              ? await readStoredUploadAssetBinary(assetId, "full")
              : null);

          if (!binary) {
            return null;
          }

          const src = URL.createObjectURL(binary.blob);
          trackRuntimeAssetUrl(promiseKey, src);
          setResolvedMediaState({
            assetId,
            variant,
            src,
            set,
          });

          return {
            assetId,
            variant,
            src,
          } satisfies UploadResolvedAssetMedia;
        } finally {
          mediaPromises.delete(promiseKey);
        }
      })();

      mediaPromises.set(promiseKey, nextPromise);
      return nextPromise;
    },

    clearError: () =>
      set({
        lastError: null,
        importStatus: get().importStatus === "error" ? "idle" : get().importStatus,
      }),
  }),
);
