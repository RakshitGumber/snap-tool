import { useEffect } from "react";

import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";
import type { UploadAssetMediaVariant } from "@/types/uploads";

export const useResolvedAssetMedia = (
  assetId: string | null | undefined,
  variant: UploadAssetMediaVariant,
) => {
  const media = useUploadLibraryStore((state) =>
    assetId ? state.resolvedMediaByAssetId[assetId]?.[variant] ?? null : null,
  );
  const resolveAssetMedia = useUploadLibraryStore((state) => state.resolveAssetMedia);

  useEffect(() => {
    if (!assetId || media) {
      return;
    }

    void resolveAssetMedia(assetId, variant);
  }, [assetId, media, resolveAssetMedia, variant]);

  return media;
};
