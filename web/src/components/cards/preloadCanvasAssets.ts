import {
  getBackgroundPresetBackground,
  getBackgroundPresetById,
} from "@/config/backgroundPresets";
import { loadBackgroundTexture } from "@/components/cards/backgroundTexture";
import {
  getLinkCardPresetById,
  type LinkCardImageSlot,
} from "@/components/cards/presets";
import {
  getImageSlotValue,
  loadPixiTexture,
} from "@/components/cards/presets/shared";
import type { CanvasSize } from "@/config/canvasPresets";
import type { LinkCardCanvasItem } from "@/stores/useCanvasStore";

export const getCardImageUrls = (
  card: LinkCardCanvasItem | null,
  imageSlots: LinkCardImageSlot[],
) => {
  if (!card) return [];

  return imageSlots
    .map((slot) => getImageSlotValue(card.metadata, slot))
    .filter((src): src is string => Boolean(src));
};

export const preloadCanvasAssets = async ({
  activeBackgroundId,
  activeCard,
  canvasSize,
}: {
  activeBackgroundId: string;
  activeCard: LinkCardCanvasItem | null;
  canvasSize: CanvasSize;
}) => {
  const background = getBackgroundPresetBackground(
    getBackgroundPresetById(activeBackgroundId),
  );
  const preset = activeCard ? getLinkCardPresetById(activeCard.presetId) : null;
  const imageUrls = getCardImageUrls(activeCard, preset?.imageSlots ?? []);

  await Promise.all([
    loadBackgroundTexture(background, canvasSize.width, canvasSize.height),
    ...imageUrls.map((src) => loadPixiTexture(src)),
  ]);
};
