import type { CardShadowSize } from "@/new_stores/useCanvasStore";

export type CardShadowOption = {
  id: CardShadowSize;
  label: string;
  css: string;
  canvas: {
    blur: number;
    offsetX: number;
    offsetY: number;
    color: string;
  };
};

export const CARD_SHADOW_OPTIONS: CardShadowOption[] = [
  {
    id: "none",
    label: "None",
    css: "none",
    canvas: { blur: 0, offsetX: 0, offsetY: 0, color: "transparent" },
  },
  {
    id: "sm",
    label: "Small",
    css: "0 8px 20px rgba(15, 23, 42, 0.18)",
    canvas: { blur: 20, offsetX: 0, offsetY: 8, color: "rgba(15, 23, 42, 0.18)" },
  },
  {
    id: "md",
    label: "Medium",
    css: "0 18px 42px rgba(15, 23, 42, 0.24)",
    canvas: { blur: 42, offsetX: 0, offsetY: 18, color: "rgba(15, 23, 42, 0.24)" },
  },
  {
    id: "lg",
    label: "Large",
    css: "0 30px 70px rgba(15, 23, 42, 0.32)",
    canvas: { blur: 70, offsetX: 0, offsetY: 30, color: "rgba(15, 23, 42, 0.32)" },
  },
];

export const getCardShadowOption = (shadowSize: CardShadowSize) =>
  CARD_SHADOW_OPTIONS.find((option) => option.id === shadowSize) ??
  CARD_SHADOW_OPTIONS[0];
