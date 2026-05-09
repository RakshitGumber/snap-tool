// Review note: Background-effect normalization and CSS conversion helpers shared by preview, canvas, and export paths.
// The comments in this file are intentionally dense to support the requested review pass.

import type { CanvasBackgroundEffects } from "@/types/canvas";

/**
 * Narrows effect operations to the keys supported by CanvasBackgroundEffects.
 */
export type CanvasBackgroundEffectKey = keyof CanvasBackgroundEffects;

/**
 * Defines the stable control order shown in the background effects UI.
 */
export const CANVAS_BACKGROUND_EFFECT_ORDER: CanvasBackgroundEffectKey[] = [
  "hue",
  "saturation",
  "blur",
  "brightness",
  "contrast",
  "opacity",
];

/**
 * Describes one slider-like control and its formatting rules.
 */
type CanvasBackgroundEffectControl = {
  label: string;
  min: number;
  max: number;
  step: number;
  unit: "deg" | "%" | "px";
};

/**
 * Represents the neutral visual effect stack for newly-created backgrounds.
 */
export const DEFAULT_CANVAS_BACKGROUND_EFFECTS: CanvasBackgroundEffects = {
  hue: 0,
  saturation: 100,
  blur: 0,
  brightness: 100,
  contrast: 100,
  opacity: 100,
};

/**
 * Maps each effect key to the UI constraints used by panels and normalization.
 */
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

/**
 * Handles the clamp background effect value behavior for this module.
 */
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

/**
 * Clamps and fills partial effect updates before they are committed to canvas state.
 */
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

/**
 * Compares normalized effect objects so history only records meaningful changes.
 */
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

/**
 * Turns effect state into the CSS filter string used by previews and canvas layers.
 */
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

/**
 * Separates opacity from filter effects because canvas and DOM apply it differently.
 */
export const getCanvasBackgroundOpacity = (
  effects: Partial<CanvasBackgroundEffects> | null | undefined,
) => normalizeCanvasBackgroundEffects(effects).opacity / 100;

/**
 * Expands blurred image backgrounds enough to hide transparent edges.
 */
export const getCanvasBackgroundBlurPadding = (
  effects: Partial<CanvasBackgroundEffects> | null | undefined,
) => Math.ceil(normalizeCanvasBackgroundEffects(effects).blur * 4);

/**
 * Formats slider values for compact display in the background panel.
 */
export const formatCanvasBackgroundEffectValue = (
  effectId: CanvasBackgroundEffectKey,
  value: number,
) => {
  const control = CANVAS_BACKGROUND_EFFECT_CONTROLS[effectId];
  const normalizedValue = clampBackgroundEffectValue(effectId, value);

  return `${normalizedValue}${control.unit}`;
};
