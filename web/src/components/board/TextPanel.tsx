import { useEffect, useId } from "react";

import clsx from "clsx";

import {
  ensureGoogleFontLoaded,
  useGoogleFontsCatalog,
} from "@/libs/googleFonts";
import {
  normalizeBoardTextFamily,
  useTextConfig,
} from "@/stores/useConfigStore";
import { useCanvasShell, useCanvasStore } from "@/stores/useCanvasStore";
import {
  useEditorUiStore,
  useSelectedTextId,
  useTextDraft,
} from "@/stores/useEditorUiStore";
import type { BoardTextAlign, BoardTextInput } from "@/types/canvas";

const ALIGN_OPTIONS: Array<{ value: BoardTextAlign; label: string }> = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export const BoardTextPanel = () => {
  const datalistId = useId();

  const canvasShell = useCanvasShell();
  const textConfig = useTextConfig();
  const draft = useTextDraft();
  const selectedTextId = useSelectedTextId();
  const insertTextOnActiveCanvas = useCanvasStore(
    (state) => state.insertTextOnActiveCanvas,
  );
  const updateTextOnCanvas = useCanvasStore(
    (state) => state.updateTextOnCanvas,
  );
  const clearSelection = useEditorUiStore((state) => state.clearSelection);
  const updateTextDraft = useEditorUiStore((state) => state.updateTextDraft);
  const resetTextDraft = useEditorUiStore((state) => state.resetTextDraft);
  const fontCatalog = useGoogleFontsCatalog();

  useEffect(() => {
    ensureGoogleFontLoaded(draft.fontFamily);
  }, [draft.fontFamily]);

  const syncDraft = <Key extends keyof BoardTextInput>(
    key: Key,
    value: BoardTextInput[Key],
  ) => {
    updateTextDraft({
      [key]: value,
    } as Partial<BoardTextInput>);

    if (!selectedTextId) {
      return;
    }

    updateTextOnCanvas(selectedTextId, {
      [key]: value,
    } as Partial<BoardTextInput>);
  };

  const handleAddText = () => {
    if (!canvasShell) {
      return;
    }

    const text = draft.text.trim();
    const fontFamily = normalizeBoardTextFamily(draft.fontFamily);
    if (!text || !fontFamily) {
      return;
    }

    ensureGoogleFontLoaded(fontFamily);
    insertTextOnActiveCanvas({
      ...draft,
      text,
      fontFamily,
      maxWidth: Math.min(draft.maxWidth, canvasShell.width),
    });
  };

  const handleResetDraft = () => {
    clearSelection();
    resetTextDraft();
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="rounded-2xl p-4">
        <label className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
          Content
        </label>
        <textarea
          value={draft.text}
          onChange={(event) => syncDraft("text", event.target.value)}
          rows={1}
          style={{ fieldSizing: "content" }}
          placeholder="Hello, World!"
          className="mt-3 w-full rounded-lg border border-border-color/70 bg-card-bg px-3 py-3 text-sm text-title-color outline-none transition placeholder:text-secondary-text focus:border-accent resize-none"
        />
        <div className="flex ">
          <button
            type="button"
            onClick={handleAddText}
            disabled={
              !draft.text.trim() || !normalizeBoardTextFamily(draft.fontFamily)
            }
            className="flex-1 rounded-lg bg-title-color px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4">
        <input
          list={datalistId}
          value={draft.fontFamily}
          onChange={(event) => syncDraft("fontFamily", event.target.value)}
          placeholder="Open Sans"
          className="mt-3 w-full rounded-xl border border-border-color/70 bg-card-bg px-3 py-2 text-sm text-title-color outline-none transition placeholder:text-secondary-text focus:border-accent"
        />
        <datalist id={datalistId}>
          {fontCatalog.families.map((family) => (
            <option key={family} value={family} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-4 rounded-2xl p-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
            Font size
          </span>
          <input
            type="number"
            min="16"
            max="160"
            step="1"
            value={draft.fontSize}
            onChange={(event) =>
              syncDraft("fontSize", Number(event.target.value))
            }
            className="w-full accent-accent"
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-2xl p-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
            Weight
          </span>
          <select
            value={draft.fontWeight}
            onChange={(event) =>
              syncDraft("fontWeight", Number(event.target.value))
            }
            className="w-full rounded-xl border border-border-color/70 bg-card-bg px-3 py-2 text-sm text-title-color outline-none transition focus:border-accent"
          >
            {textConfig.weightOptions.map((weight) => (
              <option key={weight} value={weight}>
                {weight}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
            Color
          </span>
          <div className="flex items-center gap-3 rounded-xl border border-border-color/70 bg-card-bg px-3 py-2">
            <input
              type="color"
              value={draft.color}
              onChange={(event) => syncDraft("color", event.target.value)}
              className="h-10 w-12 rounded-md border-0 bg-transparent p-0"
            />
            <span className="text-sm text-title-color">{draft.color}</span>
          </div>
        </label>
      </div>

      <div className="rounded-2xl p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
          Align
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ALIGN_OPTIONS.map((option) => {
            const isActive = draft.align === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => syncDraft("align", option.value)}
                className={clsx(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-title-color text-bg"
                    : "outline outline-border-color/60 hover:outline-accent/70",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
