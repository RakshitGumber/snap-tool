export type UploadAssetSource =
  | "built-in"
  | "local-file"
  | "image-url"
  | "youtube"
  | "github";

export type UploadAssetStorageKind = "bundled" | "indexeddb-blob" | "remote-url";

export type UploadLibraryAsset = {
  id: string;
  name: string;
  source: UploadAssetSource;
  src: string;
  thumbnailSrc: string;
  originalUrl?: string;
  mimeType?: string;
  width: number;
  height: number;
  addedAt: string;
  storageKind: UploadAssetStorageKind;
};

export type StoredUploadLibraryAsset = Omit<UploadLibraryAsset, "src" | "thumbnailSrc"> & {
  src?: string;
  thumbnailSrc?: string;
  blob?: Blob;
};
