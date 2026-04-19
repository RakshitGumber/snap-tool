const DRAG_ASSET_PREFIX = "snap-upload-asset:";
export const DRAG_ASSET_DATA_TYPE = "application/x-snap-upload-asset";

let activeDraggedAssetId: string | null = null;

export const setDraggedAssetId = (dataTransfer: DataTransfer, assetId: string) => {
  const payload = `${DRAG_ASSET_PREFIX}${assetId}`;
  activeDraggedAssetId = assetId;

  dataTransfer.effectAllowed = "copy";

  try {
    dataTransfer.setData(DRAG_ASSET_DATA_TYPE, assetId);
  } catch {
    // Some browsers restrict custom drag types; plain text fallback covers that case.
  }

  dataTransfer.setData("text/plain", payload);
};

export const clearDraggedAssetId = () => {
  activeDraggedAssetId = null;
};

export const getDraggedAssetId = (dataTransfer: DataTransfer) => {
  try {
    const customValue = dataTransfer.getData(DRAG_ASSET_DATA_TYPE);
    if (customValue) {
      return customValue;
    }
  } catch {
    // Ignore and continue to plain-text fallback.
  }

  const textValue = dataTransfer.getData("text/plain");
  if (!textValue.startsWith(DRAG_ASSET_PREFIX)) {
    return activeDraggedAssetId;
  }

  return textValue.slice(DRAG_ASSET_PREFIX.length) || activeDraggedAssetId;
};
