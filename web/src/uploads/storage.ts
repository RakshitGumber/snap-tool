// Review note: IndexedDB storage layer for upload-library metadata and binary media records.
// The comments in this file are intentionally dense to support the requested review pass.

import type {
  LegacyStoredUploadLibraryAsset,
  StoredUploadAssetBinary,
  StoredUploadAssetMeta,
  UploadAssetMediaVariant,
} from "@/types/uploads";

/**
 * Keeps db_name in one named constant so related calculations stay consistent.
 */
const DB_NAME = "snap-tool-upload-library";
/**
 * Keeps legacy_store_name in one named constant so related calculations stay consistent.
 */
const LEGACY_STORE_NAME = "assets";
/**
 * Keeps meta_store_name in one named constant so related calculations stay consistent.
 */
const META_STORE_NAME = "assetMeta";
/**
 * Keeps binary_store_name in one named constant so related calculations stay consistent.
 */
const BINARY_STORE_NAME = "assetBinary";
/**
 * Keeps db_version in one named constant so related calculations stay consistent.
 */
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Builds the compound IndexedDB key for one asset media variant.
 */
export const getBinaryRecordId = (
  assetId: string,
  variant: UploadAssetMediaVariant,
) => `${assetId}:${variant}`;

/**
 * Migrates legacy all-in-one stored assets into metadata-only records.
 */
export const toStoredAssetMetaFromLegacy = (
  asset: LegacyStoredUploadLibraryAsset,
): StoredUploadAssetMeta => ({
  id: asset.id,
  name: asset.name,
  source: asset.source,
  storageKind:
    asset.storageKind === "indexeddb-blob" ? "local-indexeddb" : asset.storageKind,
  width: asset.width,
  height: asset.height,
  addedAt: asset.addedAt,
  mimeType: asset.mimeType,
  originalUrl: asset.originalUrl,
  previewUrl: asset.thumbnailSrc ?? asset.src ?? null,
  remoteUrl: asset.src ?? asset.thumbnailSrc ?? null,
});

/**
 * Handles the to stored asset binaries from legacy behavior for this module.
 */
const toStoredAssetBinariesFromLegacy = (
  asset: LegacyStoredUploadLibraryAsset,
): StoredUploadAssetBinary[] => {
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (asset.storageKind !== "indexeddb-blob" || !asset.blob) {
    // Return the resolved value to the caller after all guards and transformations.
    return [];
  }

  return [
    {
      id: getBinaryRecordId(asset.id, "full"),
      assetId: asset.id,
      variant: "full",
      mimeType: asset.mimeType,
      blob: asset.blob,
    },
    {
      id: getBinaryRecordId(asset.id, "preview"),
      assetId: asset.id,
      variant: "preview",
      mimeType: asset.mimeType,
      blob: asset.blob,
    },
  ];
};

/**
 * Handles the open upload library database behavior for this module.
 */
const openUploadLibraryDatabase = () => {
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (dbPromise) {
    // Return the resolved value to the caller after all guards and transformations.
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = request.result;
      const transaction = request.transaction;

      if (!database.objectStoreNames.contains(META_STORE_NAME)) {
        database.createObjectStore(META_STORE_NAME, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(BINARY_STORE_NAME)) {
        database.createObjectStore(BINARY_STORE_NAME, { keyPath: "id" });
      }

      if (
        event.oldVersion < 2 &&
        transaction &&
        database.objectStoreNames.contains(LEGACY_STORE_NAME)
      ) {
        const legacyStore = transaction.objectStore(LEGACY_STORE_NAME);
        const metaStore = transaction.objectStore(META_STORE_NAME);
        const binaryStore = transaction.objectStore(BINARY_STORE_NAME);

        legacyStore.openCursor().onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
          // Guard this branch so missing or invalid state does not flow into the main path.
          if (!cursor) {
            // Return the resolved value to the caller after all guards and transformations.
            return;
          }

          const legacyAsset = cursor.value as LegacyStoredUploadLibraryAsset;
          metaStore.put(toStoredAssetMetaFromLegacy(legacyAsset));

          for (const binary of toStoredAssetBinariesFromLegacy(legacyAsset)) {
            binaryStore.put(binary);
          }

          cursor.continue();
        };
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open upload library database."));
  });

  return dbPromise;
};

/**
 * Handles the with store behavior for this module.
 */
const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (
    store: IDBObjectStore,
    resolve: (value: T) => void,
    reject: (error: Error) => void,
  ) => void,
) => {
  const database = await openUploadLibraryDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    run(store, resolve, reject);

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("Upload library transaction failed."));
    };
  });
};

/**
 * Reads all persisted upload asset metadata records.
 */
export const readStoredUploadAssetMeta = () =>
  withStore<StoredUploadAssetMeta[]>(META_STORE_NAME, "readonly", (store, resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      const assets = Array.isArray(request.result)
        ? (request.result as StoredUploadAssetMeta[])
        : [];

      resolve(assets);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to read upload library assets."));
    };
  });

/**
 * Persists one upload asset metadata record.
 */
export const saveStoredUploadAssetMeta = (asset: StoredUploadAssetMeta) =>
  withStore<void>(META_STORE_NAME, "readwrite", (store, resolve, reject) => {
    const request = store.put(asset);

    request.onsuccess = () => resolve(undefined);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to save upload library asset metadata."));
    };
  });

/**
 * Reads one persisted binary media variant for a local asset.
 */
export const readStoredUploadAssetBinary = (
  assetId: string,
  variant: UploadAssetMediaVariant,
) =>
  withStore<StoredUploadAssetBinary | null>(
    BINARY_STORE_NAME,
    "readonly",
    (store, resolve, reject) => {
      const request = store.get(getBinaryRecordId(assetId, variant));

      request.onsuccess = () => {
        const result = request.result as StoredUploadAssetBinary | undefined;
        resolve(result ?? null);
      };

      request.onerror = () => {
        reject(request.error ?? new Error("Failed to read upload library binary."));
      };
    },
  );

/**
 * Persists one binary media variant for a local asset.
 */
export const saveStoredUploadAssetBinary = (binary: StoredUploadAssetBinary) =>
  withStore<void>(BINARY_STORE_NAME, "readwrite", (store, resolve, reject) => {
    const request = store.put(binary);

    request.onsuccess = () => resolve(undefined);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to save upload library binary."));
    };
  });
