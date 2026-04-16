import { useEffect, useMemo, useRef, useState } from "react";

import type { BoardFrame, FrameDimensions } from "@/stores/useBoardStore";

const CUSTOM_MIN = 200;
const CUSTOM_MAX = 4000;

type FramePresetId = "landscape" | "portrait" | "square" | "custom";

type PresetOption = {
  id: FramePresetId;
  label: string;
  description: string;
  size?: FrameDimensions;
};

type FramesPanelProps = {
  selectedFrame: BoardFrame | null;
  onResizeFrame: (size: FrameDimensions) => void;
};

const PRESET_OPTIONS: PresetOption[] = [
  {
    id: "landscape",
    label: "Landscape",
    description: "1280 x 720",
    size: { width: 1280, height: 720 },
  },
  {
    id: "portrait",
    label: "Portrait",
    description: "720 x 1280",
    size: { width: 720, height: 1280 },
  },
  {
    id: "square",
    label: "Square",
    description: "1080 x 1080",
    size: { width: 1080, height: 1080 },
  },
  {
    id: "custom",
    label: "Custom",
    description: "Set width and height",
  },
];

const parseDimension = (value: string) => Number.parseInt(value, 10);

const isValidDimension = (value: number) =>
  Number.isInteger(value) && value >= CUSTOM_MIN && value <= CUSTOM_MAX;

const getPresetFromSize = ({
  width,
  height,
}: FrameDimensions): FramePresetId => {
  const matchingPreset = PRESET_OPTIONS.find(
    (option) =>
      option.size?.width === width && option.size?.height === height,
  );

  return matchingPreset?.id ?? "custom";
};

export const FramesPanel = ({
  selectedFrame,
  onResizeFrame,
}: FramesPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] =
    useState<FramePresetId>("square");
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const panelRef = useRef<HTMLDivElement | null>(null);

  const activeOption = useMemo(
    () => PRESET_OPTIONS.find((option) => option.id === selectedPreset)!,
    [selectedPreset],
  );

  const customWidthValue = parseDimension(customWidth);
  const customHeightValue = parseDimension(customHeight);
  const isCustomValid =
    isValidDimension(customWidthValue) && isValidDimension(customHeightValue);
  const isDisabled = !selectedFrame;

  const resizeSize = useMemo<FrameDimensions | null>(() => {
    if (activeOption.size) return activeOption.size;
    if (!isCustomValid) return null;
    return {
      width: customWidthValue,
      height: customHeightValue,
    };
  }, [activeOption.size, customHeightValue, customWidthValue, isCustomValid]);

  useEffect(() => {
    if (!selectedFrame) {
      setIsOpen(false);
      return;
    }

    setSelectedPreset(
      getPresetFromSize({
        width: selectedFrame.width,
        height: selectedFrame.height,
      }),
    );
    setCustomWidth(String(selectedFrame.width));
    setCustomHeight(String(selectedFrame.height));
  }, [selectedFrame]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const handleResize = () => {
    if (!resizeSize || !selectedFrame) return;
    onResizeFrame(resizeSize);
    setIsOpen(false);
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-3 rounded-xl border border-border-color/80 bg-bg/70 px-4 py-2 text-sm font-bold text-title-color transition enabled:hover:border-accent/70 enabled:hover:bg-bg disabled:cursor-not-allowed disabled:opacity-55"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span>Resize frame</span>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-text">
          {selectedFrame ? activeOption.label : "Select"}
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[320px] rounded-3xl border border-border-color/80 bg-card-bg/95 p-4 text-left shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-semibold text-title-color">Resize frame</p>
          <p className="mt-1 text-xs text-text-color">
            Change the selected frame size using a preset or custom pixels.
          </p>

          <div className="mt-4 grid gap-2">
            {PRESET_OPTIONS.map((option) => {
              const isSelected = option.id === selectedPreset;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedPreset(option.id)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-accent bg-accent/10"
                      : "border-border-color/80 bg-bg/50 hover:border-accent/60"
                  }`}
                >
                  <span className="block text-sm font-semibold text-title-color">
                    {option.label}
                  </span>
                  <span className="block text-xs text-text-color">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedPreset === "custom" ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-text">
                Width
                <input
                  type="number"
                  inputMode="numeric"
                  min={CUSTOM_MIN}
                  max={CUSTOM_MAX}
                  step={1}
                  value={customWidth}
                  onChange={(event) => setCustomWidth(event.target.value)}
                  className="rounded-2xl border border-border-color/80 bg-bg/60 px-3 py-2 text-sm font-semibold tracking-normal text-title-color outline-none transition focus:border-accent"
                />
              </label>
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-text">
                Height
                <input
                  type="number"
                  inputMode="numeric"
                  min={CUSTOM_MIN}
                  max={CUSTOM_MAX}
                  step={1}
                  value={customHeight}
                  onChange={(event) => setCustomHeight(event.target.value)}
                  className="rounded-2xl border border-border-color/80 bg-bg/60 px-3 py-2 text-sm font-semibold tracking-normal text-title-color outline-none transition focus:border-accent"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-text">
                Size
              </p>
              <p className="text-sm font-semibold text-title-color">
                {resizeSize
                  ? `${resizeSize.width} x ${resizeSize.height}`
                  : "Enter 200-4000 px"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResize}
              disabled={!resizeSize || isDisabled}
              className="rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-bg transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Resize
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
