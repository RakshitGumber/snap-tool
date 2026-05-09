// Review note: Upload-library store for built-in assets, local persistence, media resolution, and import status.
// The comments in this file are intentionally dense to support the requested review pass.

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

/**
 * Documents the upload library state contract used by the surrounding feature.
 */
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

/**
 * Documents the upload library actions contract used by the surrounding feature.
 */
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

/**
 * Keeps built_in_asset_definitions in one named constant so related calculations stay consistent.
 */
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

/**
 * Keeps max_file_import_concurrency in one named constant so related calculations stay consistent.
 */
const MAX_FILE_IMPORT_CONCURRENCY = 4;
/**
 * Handles the runtime asset urls behavior for this module.
 */
const runtimeAssetUrls = new Map<string, string>();
/**
 * Handles the media promises behavior for this module.
 */
const mediaPromises = new Map<string, Promise<UploadResolvedAssetMedia | null>>();
let hydrationPromise: Promise<void> | null = null;

/**
 * Handles the sort assets behavior for this module.
 */
const sortAssets = (assets: UploadLibraryAssetMeta[]) =>
  [...assets].sort((left, right) => {
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (left.source === "built-in" && right.source !== "built-in") return -1;
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (left.source !== "built-in" && right.source === "built-in") return 1;

    return right.addedAt.localeCompare(left.addedAt);
  });

/**
 * Handles the to normalized assets behavior for this module.
 */
const toNormalizedAssets = (assets: UploadLibraryAssetMeta[]) => ({
  assetOrder: assets.map((asset) => asset.id),
  assetMetaById: Object.fromEntries(assets.map((asset) => [asset.id, asset])),
});

/**
 * Handles the merge built in and stored assets behavior for this module.
 */
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

/**
 * Resolves get media cache key from the available editor state.
 */
const getMediaCacheKey = (assetId: string, variant: UploadAssetMediaVariant) =>
  `${assetId}:${variant}`;

/**
 * Handles the track runtime asset url behavior for this module.
 */
const trackRuntimeAssetUrl = (cacheKey: string, url: string) => {
  const previousUrl = runtimeAssetUrls.get(cacheKey);
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (previousUrl && previousUrl !== url) {
    URL.revokeObjectURL(previousUrl);
  }

  runtimeAssetUrls.set(cacheKey, url);
};

/**
 * Handles the clear runtime asset urls behavior for this module.
 */
const clearRuntimeAssetUrls = () => {
  // Walk each item deliberately because order and accumulated state matter here.
  for (const url of runtimeAssetUrls.values()) {
    URL.revokeObjectURL(url);
  }

  runtimeAssetUrls.clear();
};

/**
 * Handles the map with concurrency behavior for this module.
 */
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

/**
 * Answers the is supported image file predicate used to choose the next branch.
 */
const isSupportedImageFile = (file: File) =>
  file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);

/**
 * Handles the set resolved media state behavior for this module.
 */
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

/**
 * Owns upload asset metadata, media resolution state, persistence, and import errors.
 */
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
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
      if (get().status === "ready") {
        // Return the resolved value to the caller after all guards and transformations.
        return;
      }

      if (hydrationPromise) {
        // Return the resolved value to the caller after all guards and transformations.
        return hydrationPromise;
      }

      set({
        status: "hydrating",
        lastError: null,
      });

      hydrationPromise = (async () => {
        // Isolate fallible browser or storage work so failures can be reported without crashing the UI.
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
      // Guard this branch so missing or invalid state does not flow into the main path.
      if (!asset) return null;

      return useCanvasStore.getState().insertImageOnActiveCanvas(asset);
    },

    setUrlInput: (urlInput) => set({ urlInput }),

    resetUrlInput: () => set({ urlInput: "" }),

    resolveAssetMedia: async (assetId, variant) => {
      const cached = get().resolvedMediaByAssetId[assetId]?.[variant];
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
      if (cached) {
        // Return the resolved value to the caller after all guards and transformations.
        return cached;
      }

      const promiseKey = getMediaCacheKey(assetId, variant);
      const existingPromise = mediaPromises.get(promiseKey);
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
      if (existingPromise) {
        // Return the resolved value to the caller after all guards and transformations.
        return existingPromise;
      }

      const asset = get().assetMetaById[assetId];
      // Guard this branch so missing or invalid state does not flow into the main path.
      if (!asset) {
        // Return null when this helper cannot produce a usable value.
        return null;
      }

      const nextPromise = (async () => {
        // Isolate fallible browser or storage work so failures can be reported without crashing the UI.
        try {
          // Keep this conditional branch explicit because it changes the user-visible editor behavior.
          if (asset.storageKind === "bundled" || asset.storageKind === "remote-url") {
            const src =
              variant === "preview"
                ? asset.previewUrl ?? asset.remoteUrl
                : asset.remoteUrl ?? asset.previewUrl;
            // Guard this branch so missing or invalid state does not flow into the main path.
            if (!src) {
              // Return null when this helper cannot produce a usable value.
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
            // Return null when this helper cannot produce a usable value.
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
      // Return the resolved value to the caller after all guards and transformations.
      return nextPromise;
    },

    clearError: () =>
      set({
        lastError: null,
        importStatus: get().importStatus === "error" ? "idle" : get().importStatus,
      }),
  }),
);
