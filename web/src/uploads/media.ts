// Review note: React hook facade for resolving upload-library media from the shared store.
// The comments in this file are intentionally dense to support the requested review pass.

import { useEffect } from "react";

import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import type { UploadAssetMediaVariant } from "@/types/uploads";

/**
 * Selector hook that returns resolved media for one asset id.
 */
export const useResolvedAssetMedia = (
  assetId: string | null | undefined,
  variant: UploadAssetMediaVariant,
) => {
  // Select this store or hook value close to where the component uses it.
  const media = useUploadLibraryStore((state) =>
    assetId ? state.resolvedMediaByAssetId[assetId]?.[variant] ?? null : null,
  );
  // Select this store or hook value close to where the component uses it.
  const resolveAssetMedia = useUploadLibraryStore((state) => state.resolveAssetMedia);

  useEffect(() => {
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (!assetId || media) {
      // Return the resolved value to the caller after all guards and transformations.
      return;
    }

    void resolveAssetMedia(assetId, variant);
  }, [assetId, media, resolveAssetMedia, variant]);

  return media;
};
