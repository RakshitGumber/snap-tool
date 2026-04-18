import type { StoredUploadLibraryAsset } from "@/types/uploads";

const DB_NAME = "snap-tool-upload-library";
const STORE_NAME = "assets";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const openUploadLibraryDatabase = () => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open upload library database."));
  });

  return dbPromise;
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, resolve: (value: T) => void, reject: (error: Error) => void) => void,
) => {
  const database = await openUploadLibraryDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    run(
      store,
      resolve,
      (error) => reject(error),
    );

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("Upload library transaction failed."));
    };
  });
};

export const readStoredUploadAssets = () =>
  withStore<StoredUploadLibraryAsset[]>("readonly", (store, resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      const assets = Array.isArray(request.result)
        ? (request.result as StoredUploadLibraryAsset[])
        : [];

      resolve(assets);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to read upload library assets."));
    };
  });

export const saveStoredUploadAsset = (asset: StoredUploadLibraryAsset) =>
  withStore<void>("readwrite", (store, resolve, reject) => {
    const request = store.put(asset);

    request.onsuccess = () => resolve(undefined);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to save upload library asset."));
    };
  });
