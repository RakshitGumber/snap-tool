import { type PointerEvent, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";

import { usePanelBlur } from "@/hooks/usePanelBlur";

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

type HsvColor = {
  hue: number;
  saturation: number;
  value: number;
};

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const rgbToHex = (red: number, green: number, blue: number) =>
  `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

const hexToRgb = (hex: string) => {
  const normalizedHex = hex.replace("#", "");

  return {
    red: Number.parseInt(normalizedHex.slice(0, 2), 16),
    green: Number.parseInt(normalizedHex.slice(2, 4), 16),
    blue: Number.parseInt(normalizedHex.slice(4, 6), 16),
  };
};

const hsvToHex = ({ hue, saturation, value }: HsvColor) => {
  const chroma = value * saturation;
  const hueSegment = hue / 60;
  const secondary = chroma * (1 - Math.abs((hueSegment % 2) - 1));
  const match = value - chroma;

  const [red, green, blue] =
    hueSegment < 1
      ? [chroma, secondary, 0]
      : hueSegment < 2
        ? [secondary, chroma, 0]
        : hueSegment < 3
          ? [0, chroma, secondary]
          : hueSegment < 4
            ? [0, secondary, chroma]
            : hueSegment < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];

  return rgbToHex(
    (red + match) * 255,
    (green + match) * 255,
    (blue + match) * 255,
  );
};

const hexToHsv = (hex: string): HsvColor => {
  const { red, green, blue } = hexToRgb(hex);
  const normalizedRed = red / 255;
  const normalizedGreen = green / 255;
  const normalizedBlue = blue / 255;
  const max = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const min = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const delta = max - min;

  const hue =
    delta === 0
      ? 0
      : max === normalizedRed
        ? 60 * (((normalizedGreen - normalizedBlue) / delta) % 6)
        : max === normalizedGreen
          ? 60 * ((normalizedBlue - normalizedRed) / delta + 2)
          : 60 * ((normalizedRed - normalizedGreen) / delta + 4);

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: max === 0 ? 0 : delta / max,
    value: max,
  };
};

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(value);
  const [hsvColor, setHsvColor] = useState<HsvColor>(() => hexToHsv(value));

  usePanelBlur({
    containerRef: colorPickerRef,
    isOpen,
    onDismiss: () => setIsOpen(false),
  });

  const applyHsvColor = (color: HsvColor) => {
    const nextColor = hsvToHex(color);

    setHsvColor(color);
    setDraftColor(nextColor);
    onChange(nextColor);
  };

  const handleToggle = () => {
    const nextIsOpen = !isOpen;

    if (nextIsOpen) {
      setDraftColor(value);
      setHsvColor(hexToHsv(value));
    }

    setIsOpen(nextIsOpen);
  };

  const handleDraftColorChange = (color: string) => {
    const nextColor = color.startsWith("#") ? color : `#${color}`;

    setDraftColor(nextColor);

    if (HEX_COLOR_PATTERN.test(nextColor)) {
      setHsvColor(hexToHsv(nextColor));
      onChange(nextColor);
    }
  };

  const handleColorChartPointer = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const bounds = event.currentTarget.getBoundingClientRect();
    const saturation = clamp(
      (event.clientX - bounds.left) / bounds.width,
      0,
      1,
    );
    const nextValue =
      1 - clamp((event.clientY - bounds.top) / bounds.height, 0, 1);

    applyHsvColor({
      ...hsvColor,
      saturation,
      value: nextValue,
    });
  };

  const handleHuePointer = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const bounds = event.currentTarget.getBoundingClientRect();
    const hue = clamp((event.clientX - bounds.left) / bounds.width, 0, 1) * 360;

    applyHsvColor({
      ...hsvColor,
      hue,
    });
  };

  return (
    <div
      ref={colorPickerRef}
      className="relative flex flex-col items-center gap-1"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Choose custom background color"
        title="Choose custom background color"
        onClick={handleToggle}
        className={clsx(
          "flex h-11.5 w-11.5 items-center justify-center rounded-md text-panel-bg ring-offset-2 ring-offset-panel-bg transition hover:scale-[1.03]",
          isOpen && "ring-2 ring-accent",
        )}
        style={{ background: value }}
      >
        <Icon icon="mingcute:palette-line" fontSize={32} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-68 rounded-lg border border-border-color bg-panel-bg p-3 shadow-2xl">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="h-9 w-9 shrink-0 rounded-md border border-border-color"
              style={{ background: value }}
            />
            <label className="min-w-0 flex-1">
              <span className="sr-only">Custom color hex</span>
              <input
                value={draftColor}
                spellCheck={false}
                onChange={(event) =>
                  handleDraftColorChange(event.currentTarget.value)
                }
                className="h-9 w-full rounded-md border border-border-color bg-bg px-3 text-sm font-semibold uppercase tracking-wide text-title-color outline-none transition focus:border-accent"
              />
            </label>
          </div>
          <div
            role="slider"
            aria-label="Color saturation and brightness"
            aria-valuetext={draftColor}
            tabIndex={0}
            onPointerDown={handleColorChartPointer}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                handleColorChartPointer(event);
              }
            }}
            className="relative h-36 touch-none overflow-hidden rounded-lg border border-border-color"
            style={{
              background: `linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, hsl(${hsvColor.hue} 100% 50%))`,
            }}
          >
            <span
              className="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
              style={{
                left: `${hsvColor.saturation * 100}%`,
                top: `${(1 - hsvColor.value) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
          <div
            role="slider"
            aria-label="Color hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsvColor.hue)}
            tabIndex={0}
            onPointerDown={handleHuePointer}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                handleHuePointer(event);
              }
            }}
            className="relative mt-3 h-4 touch-none rounded-full border border-border-color"
            style={{
              background:
                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
          >
            <span
              className="pointer-events-none absolute top-1/2 h-6 w-3 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
              style={{
                left: `${(hsvColor.hue / 360) * 100}%`,
                transform: "translate(-50%, -50%)",
                background: value,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
