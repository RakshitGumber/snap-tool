export type UploadAssetSource =
  | "built-in"
  | "local-file"
  | "image-url"
  | "youtube"
  | "github";

export type UploadAssetStorageKind = "bundled" | "local-indexeddb" | "remote-url";

export type UploadAssetMediaVariant = "preview" | "full";

export type UploadLibraryAssetMeta = {
  id: string;
  name: string;
  source: UploadAssetSource;
  storageKind: UploadAssetStorageKind;
  width: number;
  height: number;
  addedAt: string;
  mimeType?: string;
  originalUrl?: string;
  previewUrl?: string | null;
  remoteUrl?: string | null;
};

export type UploadResolvedAssetMedia = {
  assetId: string;
  variant: UploadAssetMediaVariant;
  src: string;
};

export type StoredUploadAssetMeta = UploadLibraryAssetMeta;

export type StoredUploadAssetBinary = {
  id: string;
  assetId: string;
  variant: UploadAssetMediaVariant;
  mimeType?: string;
  blob: Blob;
};

export type LegacyStoredUploadLibraryAsset = {
  id: string;
  name: string;
  source: UploadAssetSource;
  storageKind: "bundled" | "indexeddb-blob" | "remote-url";
  width: number;
  height: number;
  addedAt: string;
  mimeType?: string;
  originalUrl?: string;
  src?: string;
  thumbnailSrc?: string;
  blob?: Blob;
};
