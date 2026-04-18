import type {
  LegacyStoredUploadLibraryAsset,
  StoredUploadAssetBinary,
  StoredUploadAssetMeta,
  UploadAssetMediaVariant,
} from "@/types/uploads";

const DB_NAME = "snap-tool-upload-library";
const LEGACY_STORE_NAME = "assets";
const META_STORE_NAME = "assetMeta";
const BINARY_STORE_NAME = "assetBinary";
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

export const getBinaryRecordId = (
  assetId: string,
  variant: UploadAssetMediaVariant,
) => `${assetId}:${variant}`;

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

const toStoredAssetBinariesFromLegacy = (
  asset: LegacyStoredUploadLibraryAsset,
): StoredUploadAssetBinary[] => {
  if (asset.storageKind !== "indexeddb-blob" || !asset.blob) {
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

const openUploadLibraryDatabase = () => {
  if (dbPromise) {
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
          if (!cursor) {
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

export const saveStoredUploadAssetMeta = (asset: StoredUploadAssetMeta) =>
  withStore<void>(META_STORE_NAME, "readwrite", (store, resolve, reject) => {
    const request = store.put(asset);

    request.onsuccess = () => resolve(undefined);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to save upload library asset metadata."));
    };
  });

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

export const saveStoredUploadAssetBinary = (binary: StoredUploadAssetBinary) =>
  withStore<void>(BINARY_STORE_NAME, "readwrite", (store, resolve, reject) => {
    const request = store.put(binary);

    request.onsuccess = () => resolve(undefined);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to save upload library binary."));
    };
  });
