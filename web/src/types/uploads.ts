// Review note: Canonical upload-library data model for asset metadata, media variants, and persistence records.
// The comments in this file are intentionally dense to support the requested review pass.

/**
 * Identifies where an upload-library asset originally came from.
 */
export type UploadAssetSource =
  | "built-in"
  | "local-file"
  | "image-url"
  | "youtube"
  | "github";

/**
 * Describes the storage backend used to resolve an asset later.
 */
export type UploadAssetStorageKind = "bundled" | "local-indexeddb" | "remote-url";

/**
 * Distinguishes preview media from full-resolution media.
 */
export type UploadAssetMediaVariant = "preview" | "full";

/**
 * Stores user-facing and persistence metadata for one upload-library asset.
 */
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

/**
 * Stores resolved object URLs for preview and full-size media variants.
 */
export type UploadResolvedAssetMedia = {
  assetId: string;
  variant: UploadAssetMediaVariant;
  src: string;
};

/**
 * Aliases the persisted asset metadata shape used by IndexedDB.
 */
export type StoredUploadAssetMeta = UploadLibraryAssetMeta;

/**
 * Stores one persisted binary media variant for a local asset.
 */
export type StoredUploadAssetBinary = {
  id: string;
  assetId: string;
  variant: UploadAssetMediaVariant;
  mimeType?: string;
  blob: Blob;
};

/**
 * Documents the v1 persisted shape migrated by the IndexedDB upgrade path.
 */
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
