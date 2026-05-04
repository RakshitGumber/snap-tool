import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";

import {
  createCanvasExport,
  downloadCanvasExport,
  type CanvasExportFormat,
  type CanvasExportOptions,
} from "@/canvas/exportCanvasImage";
import { useDismissibleLayer } from "@/libs/useDismissibleLayer";
import { useCanvasShell } from "@/stores/useCanvasStore";

const MIN_EXPORT_EDGE = 64;
const MAX_EXPORT_EDGE = 4096;
const DEFAULT_JPEG_QUALITY = 92;

const EXPORT_FORMAT_OPTIONS: Array<{
  format: CanvasExportFormat;
  label: string;
  detail: string;
  icon: string;
}> = [
  {
    format: "jpg",
    label: "JPG",
    detail: "Smaller file size",
    icon: "solar:camera-minimalistic-linear",
  },
  {
    format: "png",
    label: "PNG",
    detail: "Lossless quality",
    icon: "solar:gallery-circle-linear",
  },
];

const SHARE_TARGETS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    detail: "Download plus chat share",
    icon: "ic:baseline-whatsapp",
    iconClassName: "text-[#25D366]",
  },
  {
    id: "twitter",
    label: "X / Twitter",
    detail: "Download plus composer",
    icon: "ri:twitter-x-fill",
    iconClassName: "text-title-color",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    detail: "Download plus manual upload",
    icon: "mdi:pinterest",
    iconClassName: "text-[#E60023]",
  },
  {
    id: "instagram",
    label: "Instagram",
    detail: "Download plus manual upload",
    icon: "mdi:instagram",
    iconClassName: "text-[#E4405F]",
  },
] as const;

type ShareTargetId = (typeof SHARE_TARGETS)[number]["id"];

const clampDimension = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(
    MAX_EXPORT_EDGE,
    Math.max(MIN_EXPORT_EDGE, Math.round(value)),
  );
};

const openPopup = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

const getFallbackShareState = (
  targetId: ShareTargetId,
  shareText: string,
  filename: string,
) => {
  const encodedText = encodeURIComponent(shareText);

  switch (targetId) {
    case "whatsapp":
      return {
        url: `https://wa.me/?text=${encodedText}`,
        statusMessage: `Downloaded ${filename}. Attach it in WhatsApp after the chat opens.`,
      };
    case "twitter":
      return {
        url: `https://twitter.com/intent/tweet?text=${encodedText}`,
        statusMessage: `Downloaded ${filename}. Add the image manually in the X composer that opens.`,
      };
    case "pinterest":
      return {
        url: "https://www.pinterest.com/pin-builder/",
        statusMessage: `Downloaded ${filename}. Upload it manually in Pinterest after the page opens.`,
      };
    case "instagram":
      return {
        url: "https://www.instagram.com/",
        statusMessage: `Downloaded ${filename}. Upload it manually from your downloads in Instagram.`,
      };
  }
};

const tryNativeShare = async (file: File, shareText: string) => {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }

  const shareData: ShareData = {
    files: [file],
    title: shareText,
    text: shareText,
  };

  if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
    return false;
  }

  await navigator.share(shareData);
  return true;
};

export const SaveControl = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasShell = useCanvasShell();
  const sourceWidth = canvasShell?.width ?? 1080;
  const sourceHeight = canvasShell?.height ?? 1080;
  const sourceName = canvasShell?.title?.trim() || "canvas";

  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [format, setFormat] = useState<CanvasExportFormat>("jpg");
  const [exportName, setExportName] = useState(sourceName);
  const [exportWidth, setExportWidth] = useState(String(sourceWidth));
  const [exportHeight, setExportHeight] = useState(String(sourceHeight));
  const [isAspectLocked, setIsAspectLocked] = useState(true);
  const [jpegQuality, setJpegQuality] = useState(DEFAULT_JPEG_QUALITY);

  useDismissibleLayer({
    containerRef,
    isOpen,
    onDismiss: () => setIsOpen(false),
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setFormat("jpg");
    setExportName(sourceName);
    setExportWidth(String(sourceWidth));
    setExportHeight(String(sourceHeight));
    setIsAspectLocked(true);
    setJpegQuality(DEFAULT_JPEG_QUALITY);
  }, [isOpen, sourceHeight, sourceName, sourceWidth]);

  const canvasAspectRatio = sourceWidth / sourceHeight;
  const resolvedWidth = useMemo(
    () => clampDimension(Number(exportWidth), sourceWidth),
    [exportWidth, sourceWidth],
  );
  const resolvedHeight = useMemo(
    () => clampDimension(Number(exportHeight), sourceHeight),
    [exportHeight, sourceHeight],
  );
  const showStretchWarning =
    !isAspectLocked &&
    Math.abs(resolvedWidth / resolvedHeight - canvasAspectRatio) > 0.001;

  const syncWidth = useCallback(
    (nextValue: string) => {
      setExportWidth(nextValue);

      if (!isAspectLocked) {
        return;
      }

      const parsedWidth = Number(nextValue);
      if (!Number.isFinite(parsedWidth)) {
        return;
      }

      const clampedWidth = clampDimension(parsedWidth, sourceWidth);
      setExportHeight(
        String(clampDimension(clampedWidth / canvasAspectRatio, sourceHeight)),
      );
    },
    [canvasAspectRatio, isAspectLocked, sourceHeight, sourceWidth],
  );

  const syncHeight = useCallback(
    (nextValue: string) => {
      setExportHeight(nextValue);

      if (!isAspectLocked) {
        return;
      }

      const parsedHeight = Number(nextValue);
      if (!Number.isFinite(parsedHeight)) {
        return;
      }

      const clampedHeight = clampDimension(parsedHeight, sourceHeight);
      setExportWidth(
        String(clampDimension(clampedHeight * canvasAspectRatio, sourceWidth)),
      );
    },
    [canvasAspectRatio, isAspectLocked, sourceHeight, sourceWidth],
  );

  const normalizeDimensions = useCallback(() => {
    setExportWidth(String(resolvedWidth));
    setExportHeight(String(resolvedHeight));
  }, [resolvedHeight, resolvedWidth]);

  const buildExportOptions = useCallback(
    (): CanvasExportOptions => ({
      format,
      filenameBase: exportName.trim() || sourceName,
      width: resolvedWidth,
      height: resolvedHeight,
      quality: format === "jpg" ? jpegQuality : undefined,
    }),
    [
      exportName,
      format,
      jpegQuality,
      resolvedHeight,
      resolvedWidth,
      sourceName,
    ],
  );

  const handleDownload = useCallback(async () => {
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const exportResult = await createCanvasExport(buildExportOptions());
      downloadCanvasExport(exportResult);
      setIsOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the board.",
      );
    } finally {
      setIsBusy(false);
    }
  }, [buildExportOptions]);

  const handleShare = useCallback(
    async (targetId: ShareTargetId) => {
      setIsBusy(true);
      setErrorMessage(null);
      setStatusMessage(null);

      try {
        const shareText = exportName.trim() || sourceName;
        const exportResult = await createCanvasExport(buildExportOptions());
        const usedNativeShare = await tryNativeShare(exportResult.file, shareText);

        if (usedNativeShare) {
          setIsOpen(false);
          return;
        }

        downloadCanvasExport(exportResult);
        const fallbackState = getFallbackShareState(
          targetId,
          shareText,
          exportResult.filename,
        );

        openPopup(fallbackState.url);
        setStatusMessage(fallbackState.statusMessage);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Unable to prepare the share.",
        );
      } finally {
        setIsBusy(false);
      }
    },
    [buildExportOptions, exportName, sourceName],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="Save canvas"
        aria-expanded={isOpen}
        onClick={() => {
          if (isBusy) {
            return;
          }

          setErrorMessage(null);
          setStatusMessage(null);
          setIsOpen(!isOpen);
        }}
        className="flex h-10 items-center gap-2 rounded-lg bg-accent px-3 py-2 text-bg transition"
        disabled={isBusy}
      >
        <Icon icon="solar:diskette-broken" className="text-xl" />
        <span className="font-sans font-bold">
          {isBusy ? "Preparing..." : "Save"}
        </span>
      </button>

      {isOpen ? (
        <div
          className={clsx(
            "z-50 overflow-y-auto rounded-2xl border-2 border-border-color bg-card-bg shadow-[0_18px_40px_rgba(15,23,42,0.12)]",
            "fixed inset-x-3 bottom-3 top-20 p-3 sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[70vh] sm:w-[32rem] sm:p-4",
          )}
        >
          <div className="space-y-5 font-sans">
            <section className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                    Save & Share
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-title-color">
                    Export your image
                  </h3>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-title-color outline outline-border-color/60">
                  {sourceWidth} x {sourceHeight}
                </span>
              </div>
              <p className="text-sm text-secondary-text">
                Choose the file name, output size, compression, and a quick share path.
              </p>
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                  Name
                </p>
              </div>
              <input
                type="text"
                value={exportName}
                onChange={(event) => setExportName(event.target.value)}
                placeholder="my-social-post"
                className="w-full rounded-xl border border-border-color/70 bg-card-bg px-3 py-2 text-sm text-title-color outline-none transition placeholder:text-secondary-text focus:border-accent"
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                  Export Settings
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormat("jpg");
                    setExportWidth(String(sourceWidth));
                    setExportHeight(String(sourceHeight));
                    setIsAspectLocked(true);
                    setJpegQuality(DEFAULT_JPEG_QUALITY);
                  }}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-title-color outline outline-border-color/60 transition hover:outline-accent/70"
                >
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {EXPORT_FORMAT_OPTIONS.map((option) => {
                  const isActive = option.format === format;

                  return (
                    <button
                      key={option.format}
                      type="button"
                      onClick={() => setFormat(option.format)}
                      className={clsx(
                        "rounded-2xl border px-3 py-3 text-left transition",
                        isActive
                          ? "border-accent/70 bg-accent/10 text-accent"
                          : "border-border-color/60 text-title-color hover:border-accent/70 hover:text-accent",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon={option.icon} className="text-lg" />
                        <p className="text-sm font-semibold">{option.label}</p>
                      </div>
                      <p
                        className={clsx(
                          "mt-2 text-xs",
                          isActive ? "text-accent/90" : "text-secondary-text",
                        )}
                      >
                        {option.detail}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-border-color/50 bg-card-bg/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-title-color">
                    Output size
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIsLocked = !isAspectLocked;
                      setIsAspectLocked(nextIsLocked);

                      if (nextIsLocked) {
                        setExportHeight(
                          String(
                            clampDimension(
                              resolvedWidth / canvasAspectRatio,
                              sourceHeight,
                            ),
                          ),
                        );
                      }
                    }}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition",
                      isAspectLocked
                        ? "bg-title-color text-bg"
                        : "outline outline-border-color/60 hover:outline-accent/70",
                    )}
                  >
                    <Icon
                      icon={
                        isAspectLocked
                          ? "solar:lock-keyhole-minimalistic-bold"
                          : "solar:lock-keyhole-minimalistic-unlocked-linear"
                      }
                      className="text-sm"
                    />
                    {isAspectLocked ? "Ratio locked" : "Ratio unlocked"}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
                      Width
                    </span>
                    <input
                      type="number"
                      min={MIN_EXPORT_EDGE}
                      max={MAX_EXPORT_EDGE}
                      step="1"
                      value={exportWidth}
                      onChange={(event) => syncWidth(event.target.value)}
                      onBlur={normalizeDimensions}
                      className="w-full rounded-xl border border-border-color/70 bg-card-bg px-3 py-2 text-sm text-title-color outline-none transition focus:border-accent"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
                      Height
                    </span>
                    <input
                      type="number"
                      min={MIN_EXPORT_EDGE}
                      max={MAX_EXPORT_EDGE}
                      step="1"
                      value={exportHeight}
                      onChange={(event) => syncHeight(event.target.value)}
                      onBlur={normalizeDimensions}
                      className="w-full rounded-xl border border-border-color/70 bg-card-bg px-3 py-2 text-sm text-title-color outline-none transition focus:border-accent"
                    />
                  </label>
                </div>

                <p className="mt-3 text-xs text-secondary-text">
                  Export-only dimensions. Your live canvas stays unchanged.
                </p>
                {showStretchWarning ? (
                  <p className="mt-3 rounded-xl bg-[#FFF6E5] px-3 py-2 text-xs text-[#8A5A10]">
                    The ratio is unlocked, so this export will stretch the current design.
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border-color/50 bg-card-bg/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-title-color">
                    Compression
                  </p>
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                    {format === "jpg" ? `${jpegQuality}%` : "Lossless"}
                  </span>
                </div>

                {format === "jpg" ? (
                  <>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="1"
                      value={jpegQuality}
                      onChange={(event) =>
                        setJpegQuality(Number(event.target.value))
                      }
                      className="mt-4 w-full accent-accent"
                    />
                    <p className="mt-3 text-xs text-secondary-text">
                      Lower quality creates a smaller JPG. Higher quality keeps more detail.
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-secondary-text">
                    PNG exports are lossless, so compression quality does not apply.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                Download
              </p>
              <button
                type="button"
                onClick={() => {
                  void handleDownload();
                }}
                disabled={isBusy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-bg transition hover:opacity-95 disabled:cursor-wait disabled:opacity-70"
              >
                <Icon icon="solar:download-minimalistic-linear" className="text-lg" />
                {isBusy ? "Preparing export..." : "Download image"}
              </button>
            </section>

            <section className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
                Share
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SHARE_TARGETS.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => {
                      void handleShare(target.id);
                    }}
                    disabled={isBusy}
                    className="rounded-2xl border border-border-color/60 px-3 py-3 text-left transition hover:border-accent/70 hover:bg-surface-3/50 disabled:cursor-wait disabled:opacity-70"
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={target.icon}
                        className={clsx("text-lg", target.iconClassName)}
                      />
                      <p className="text-sm font-semibold text-title-color">
                        {target.label}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-secondary-text">
                      {target.detail}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-secondary-text">
                Native file sharing opens first when the browser supports it. Otherwise the image downloads and a platform fallback opens.
              </p>
            </section>

            {statusMessage ? (
              <p className="rounded-xl bg-accent/10 px-3 py-2 text-xs text-accent">
                {statusMessage}
              </p>
            ) : null}

            {errorMessage ? (
              <p className="rounded-xl bg-[#FFE8E5] px-3 py-2 text-xs text-[#8A2F23]">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
