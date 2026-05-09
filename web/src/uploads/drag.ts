// Review note: Drag-and-drop transfer helpers for moving upload assets from the library to the canvas.
// The comments in this file are intentionally dense to support the requested review pass.

/**
 * Keeps drag_asset_prefix in one named constant so related calculations stay consistent.
 */
const DRAG_ASSET_PREFIX = "snap-upload-asset:";
/**
 * Custom drag MIME type used so canvas drops can identify library assets.
 */
export const DRAG_ASSET_DATA_TYPE = "application/x-snap-upload-asset";

let activeDraggedAssetId: string | null = null;

/**
 * Writes the asset id into the drag payload and fallback process memory.
 */
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

/**
 * Clears the process-memory fallback when a drag finishes.
 */
export const clearDraggedAssetId = () => {
  activeDraggedAssetId = null;
};

/**
 * Reads a dragged asset id from the custom payload or fallback storage.
 */
export const getDraggedAssetId = (dataTransfer: DataTransfer) => {
  // Isolate fallible browser or storage work so failures can be reported without crashing the UI.
  try {
    const customValue = dataTransfer.getData(DRAG_ASSET_DATA_TYPE);
    // Keep this conditional branch explicit because it changes the user-visible editor behavior.
    if (customValue) {
      // Return the resolved value to the caller after all guards and transformations.
      return customValue;
    }
  } catch {
    // Ignore and continue to plain-text fallback.
  }

  const textValue = dataTransfer.getData("text/plain");
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!textValue.startsWith(DRAG_ASSET_PREFIX)) {
    // Return the resolved value to the caller after all guards and transformations.
    return activeDraggedAssetId;
  }

  return textValue.slice(DRAG_ASSET_PREFIX.length) || activeDraggedAssetId;
};
