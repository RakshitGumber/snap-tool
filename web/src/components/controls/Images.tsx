import { type FormEvent, useRef, useState } from "react";
import { Icon } from "@iconify/react";

import {
  resolveLinkCardMetadata,
  type LinkCardMetadata,
} from "@/libs/linkCards";
import {
  getLinkCardPresetsBySource,
  type LinkCardPreset,
} from "@/config/linkCardPresets";
import {
  type LinkCardCanvasItem,
  useCanvasStore,
} from "@/stores/useCanvasStore";
import { CardPanel } from "../panels/CardPanel";

type LinkCardDraft = {
  id: string;
  input: string;
  status: string;
  variants: LinkCardCanvasItem[];
  error: string | null;
};

const createCardItem = (
  preset: LinkCardPreset,
  metadata: LinkCardMetadata,
): LinkCardCanvasItem => ({
  id: crypto.randomUUID(),
  presetId: preset.id,
  label: preset.label,
  metadata,
  widthRatio: preset.initialWidthRatio,
});

type ImagesProps = {
  showHeader?: boolean;
  onCardSelected?: () => void;
};

export const Images = ({ showHeader = true, onCardSelected }: ImagesProps) => {
  // const fileInputRef = useRef<HTMLInputElement | null>(null);
  const generationRef = useRef(0);
  const [urlInput, setUrlInput] = useState("");
  // const [isDropActive, setIsDropActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [cardDraft, setCardDraft] = useState<LinkCardDraft | null>(null);

  // const activeCard = useCanvasStore((state) => state.activeCard);
  const setActiveCard = useCanvasStore((state) => state.setActiveCard);

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const generationId = generationRef.current + 1;
    generationRef.current = generationId;
    const draftId = crypto.randomUUID();

    setCardDraft({
      id: draftId,
      input: urlInput.trim(),
      status: "generating",
      variants: [],
      error: null,
    });

    try {
      const metadata = await resolveLinkCardMetadata(urlInput);
      const presets = getLinkCardPresetsBySource(metadata.source);

      for (const preset of presets) {
        if (generationRef.current !== generationId) return;

        const card = createCardItem(preset, metadata);

        setCardDraft((currentDraft) => {
          if (currentDraft?.id !== draftId) return currentDraft;

          return {
            ...currentDraft,
            variants: [...currentDraft.variants, card],
            status: "generating",
          };
        });
        await Promise.resolve();
      }

      if (presets.length === 0) {
        throw new Error("No templates are available for that link.");
      }

      setCardDraft((currentDraft) =>
        currentDraft?.id === draftId
          ? { ...currentDraft, status: "ready" }
          : currentDraft,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to generate cards.";

      setCardDraft((currentDraft) =>
        currentDraft?.id === draftId
          ? { ...currentDraft, status: "error", error: message }
          : currentDraft,
      );
    }
  };

  // const handleScreenshotFile = async (file: File | null | undefined) => {
  //   if (!file) return;

  //   setLocalError(null);

  //   try {
  //     const metadata = await createScreenshotMetadata(file);
  //     const preset = getLinkCardPresetsBySource("screenshot")[0];

  //     setActiveCard(createCardItem(preset, metadata));
  //     setCardDraft(null);
  //   } catch (error) {
  //     setLocalError(
  //       error instanceof Error ? error.message : "Unable to load that image.",
  //     );
  //   }
  // };

  // const handleFileInputChange = async (event: any) => {
  //   await handleScreenshotFile(event.target.files?.[0]);
  //   event.target.value = "";
  // };

  return (
    <>
      {showHeader ? (
        <div className="flex items-center gap-3 border-b border-border-color p-4">
          <Icon
            icon="mingcute:folder-open-2-line"
            fontSize={32}
            className="text-secondary-text"
          />
          <span className="text-xl font-medium tracking-wide text-title-color">
            Images
          </span>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-5 px-4 py-4">
        <form onSubmit={handleGenerate} className="space-y-3">
          <label htmlFor="link-card-url" className="text-sm font-semibold">
            Link card
          </label>
          <div className="flex gap-2">
            <input
              id="link-card-url"
              type="text"
              inputMode="url"
              value={urlInput}
              onChange={(event) => {
                setLocalError(null);
                setUrlInput(event.target.value);
              }}
              placeholder="youtube.com/watch, github.com/user, website.com"
              className="min-w-0 flex-1 rounded-lg border border-border-color bg-bg px-3 py-2 text-sm text-title-color outline-none placeholder:text-secondary-text focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
            >
              Create
            </button>
          </div>
        </form>

        {/* <section className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDropActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDropActive(false);
            }}
            onDrop={async (event) => {
              event.preventDefault();
              setIsDropActive(false);
              await handleScreenshotFile(event.dataTransfer.files[0]);
            }}
            className={clsx(
              "flex w-full flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition",
              isDropActive
                ? "border-accent text-title-color"
                : "border-border-color text-secondary-text hover:border-accent/70 hover:text-title-color",
            )}
          >
            <Icon icon="mingcute:pic-line" fontSize={28} />
            <span className="mt-2 text-sm font-semibold text-title-color">
              Add screenshot
            </span>
            <span className="mt-1 text-xs">
              Drop an image or click to browse
            </span>
          </button>
        </section> */}

        {localError ? (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {localError}
          </div>
        ) : null}

        {/* <section className="rounded-lg border border-border-color px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-secondary-text">
            Active card
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-title-color">
            {activeCard ? getCardTitle(activeCard) : "No card selected"}
          </p>
          {activeCard ? (
            <p className="mt-1 text-xs text-secondary-text">
              {Math.round(activeCard.widthRatio * 100)}% canvas width,{" "}
              {getLinkCardPresetById(activeCard.presetId).aspectRatio.toFixed(
                2,
              )}{" "}
              ratio
            </p>
          ) : null}
        </section> */}
      </div>

      <CardPanel
        cardDraft={cardDraft}
        onClose={() => setCardDraft(null)}
        onSelect={(card) => {
          setActiveCard(card);
          setCardDraft(null);
          onCardSelected?.();
        }}
      />
    </>
  );
};
