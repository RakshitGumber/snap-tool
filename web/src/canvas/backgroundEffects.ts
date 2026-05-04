import type { CanvasBackgroundEffects } from "@/types/canvas";

export type CanvasBackgroundEffectKey = keyof CanvasBackgroundEffects;

export const CANVAS_BACKGROUND_EFFECT_ORDER: CanvasBackgroundEffectKey[] = [
  "hue",
  "saturation",
  "blur",
  "brightness",
  "contrast",
  "opacity",
];

type CanvasBackgroundEffectControl = {
  label: string;
  min: number;
  max: number;
  step: number;
  unit: "deg" | "%" | "px";
};

export const DEFAULT_CANVAS_BACKGROUND_EFFECTS: CanvasBackgroundEffects = {
  hue: 0,
  saturation: 100,
  blur: 0,
  brightness: 100,
  contrast: 100,
  opacity: 100,
};

export const CANVAS_BACKGROUND_EFFECT_CONTROLS: Record<
  CanvasBackgroundEffectKey,
  CanvasBackgroundEffectControl
> = {
  hue: {
    label: "Hue",
    min: 0,
    max: 360,
    step: 1,
    unit: "deg",
  },
  saturation: {
    label: "Saturation",
    min: 0,
    max: 200,
    step: 1,
    unit: "%",
  },
  blur: {
    label: "Blur",
    min: 0,
    max: 40,
    step: 1,
    unit: "px",
  },
  brightness: {
    label: "Brightness",
    min: 0,
    max: 200,
    step: 1,
    unit: "%",
  },
  contrast: {
    label: "Contrast",
    min: 0,
    max: 200,
    step: 1,
    unit: "%",
  },
  opacity: {
    label: "Opacity",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
  },
};

const clampBackgroundEffectValue = (
  effectId: CanvasBackgroundEffectKey,
  value: number,
) => {
  const control = CANVAS_BACKGROUND_EFFECT_CONTROLS[effectId];
  const safeValue = Number.isFinite(value)
    ? value
    : DEFAULT_CANVAS_BACKGROUND_EFFECTS[effectId];

  return Math.min(Math.max(Math.round(safeValue), control.min), control.max);
};

export const normalizeCanvasBackgroundEffects = (
  effects?: Partial<CanvasBackgroundEffects> | null,
): CanvasBackgroundEffects => ({
  hue: clampBackgroundEffectValue(
    "hue",
    effects?.hue ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS.hue,
  ),
  saturation: clampBackgroundEffectValue(
    "saturation",
    effects?.saturation ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS.saturation,
  ),
  blur: clampBackgroundEffectValue(
    "blur",
    effects?.blur ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS.blur,
  ),
  brightness: clampBackgroundEffectValue(
    "brightness",
    effects?.brightness ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS.brightness,
  ),
  contrast: clampBackgroundEffectValue(
    "contrast",
    effects?.contrast ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS.contrast,
  ),
  opacity: clampBackgroundEffectValue(
    "opacity",
    effects?.opacity ?? DEFAULT_CANVAS_BACKGROUND_EFFECTS.opacity,
  ),
});

export const areCanvasBackgroundEffectsEqual = (
  left: CanvasBackgroundEffects,
  right: CanvasBackgroundEffects,
) =>
  left.hue === right.hue &&
  left.saturation === right.saturation &&
  left.blur === right.blur &&
  left.brightness === right.brightness &&
  left.contrast === right.contrast &&
  left.opacity === right.opacity;

export const buildCanvasBackgroundFilter = (
  effects: Partial<CanvasBackgroundEffects> | null | undefined,
) => {
  const normalized = normalizeCanvasBackgroundEffects(effects);

  return [
    `hue-rotate(${normalized.hue}deg)`,
    `saturate(${normalized.saturation}%)`,
    `blur(${normalized.blur}px)`,
    `brightness(${normalized.brightness}%)`,
    `contrast(${normalized.contrast}%)`,
  ].join(" ");
};

export const getCanvasBackgroundOpacity = (
  effects: Partial<CanvasBackgroundEffects> | null | undefined,
) => normalizeCanvasBackgroundEffects(effects).opacity / 100;

export const getCanvasBackgroundBlurPadding = (
  effects: Partial<CanvasBackgroundEffects> | null | undefined,
) => Math.ceil(normalizeCanvasBackgroundEffects(effects).blur * 4);

export const formatCanvasBackgroundEffectValue = (
  effectId: CanvasBackgroundEffectKey,
  value: number,
) => {
  const control = CANVAS_BACKGROUND_EFFECT_CONTROLS[effectId];
  const normalizedValue = clampBackgroundEffectValue(effectId, value);

  return `${normalizedValue}${control.unit}`;
};
