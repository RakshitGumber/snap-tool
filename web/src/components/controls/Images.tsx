import { useRef, useState } from "react";

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

export const Images = () => {
  const generationRef = useRef(0);
  const [urlInput, setUrlInput] = useState("");
  const [_, setLocalError] = useState<string | null>(null);
  const [cardDraft, setCardDraft] = useState<LinkCardDraft | null>(null);

  const setActiveCard = useCanvasStore((state) => state.setActiveCard);

  const handleGenerate = async (event: any) => {
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

  return (
    <>
      <form onSubmit={handleGenerate} className="flex gap-2">
        <input
          id="link-card-url"
          type="text"
          inputMode="url"
          value={urlInput}
          onChange={(event) => {
            setLocalError(null);
            setUrlInput(event.target.value);
          }}
          placeholder="Enter any link"
          className="min-w-0 h-10 flex-1 rounded-lg border border-border-color bg-bg px-3 py-2 text-sm text-title-color placeholder:text-secondary-text focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg h-10 bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
        >
          Fetch
        </button>
      </form>

      <CardPanel
        cardDraft={cardDraft}
        onClose={() => setCardDraft(null)}
        onSelect={(card) => {
          setActiveCard(card);
          setCardDraft(null);
        }}
      />
    </>
  );
};
