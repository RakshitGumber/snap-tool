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
import {
  useCanvasShell,
  useCanvasStore,
  useCanvasText,
} from "@/stores/useCanvasStore";
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
  const selectedText = useCanvasText(selectedTextId ?? "");
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
    <div className="space-y-4">
      <div className="rounded-2xl p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
          Text layer
        </p>
        <p className="mt-1 text-sm text-secondary-text">
          Add text to the board, then drag it into place. Selecting a text block
          links these controls to it.
        </p>
        {selectedText ? (
          <div className="mt-3 rounded-xl bg-accent-light/20 px-3 py-2 text-sm text-title-color">
            Editing the selected text layer.
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl p-4">
        <label className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
          Content
        </label>
        <textarea
          value={draft.text}
          onChange={(event) => syncDraft("text", event.target.value)}
          rows={5}
          placeholder="Write something for the board"
          className="mt-3 min-h-32 w-full rounded-2xl border border-border-color/70 bg-card-bg px-3 py-3 text-sm text-title-color outline-none transition placeholder:text-secondary-text focus:border-accent"
        />
      </div>

      <div className="rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
              Google font family
            </p>
            <p className="mt-1 text-sm text-secondary-text">
              Enter any Google Fonts family. A full family list appears when
              `VITE_GOOGLE_FONTS_API_KEY` is configured.
            </p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-title-color outline outline-border-color/60">
            {fontCatalog.source === "api" ? fontCatalog.families.length : "Any"}
          </span>
        </div>

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

        <p className="mt-2 text-xs text-secondary-text">
          {fontCatalog.status === "loading" &&
            "Loading Google Fonts catalog..."}
          {fontCatalog.status === "ready" &&
            "Google Fonts catalog loaded for searchable suggestions."}
          {fontCatalog.status === "error" &&
            "Google Fonts catalog could not be loaded, but manual family entry still works."}
          {fontCatalog.status === "unavailable" &&
            "Manual family entry is enabled. Add a Google Fonts API key for the full list."}
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl p-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
            Font size
          </span>
          <input
            type="range"
            min="16"
            max="160"
            step="1"
            value={draft.fontSize}
            onChange={(event) =>
              syncDraft("fontSize", Number(event.target.value))
            }
            className="w-full accent-accent"
          />
          <span className="text-sm text-title-color">{draft.fontSize}px</span>
        </label>

        <label className="space-y-2">
          <span className="block text-xs uppercase tracking-[0.14em] text-secondary-text">
            Max width
          </span>
          <input
            type="range"
            min="160"
            max={Math.max(
              canvasShell?.width ?? textConfig.defaultInput.maxWidth,
              160,
            )}
            step="10"
            value={Math.min(
              draft.maxWidth,
              canvasShell?.width ?? draft.maxWidth,
            )}
            onChange={(event) =>
              syncDraft("maxWidth", Number(event.target.value))
            }
            className="w-full accent-accent"
          />
          <span className="text-sm text-title-color">{draft.maxWidth}px</span>
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

      <div className="rounded-2xl border border-border-color/60 bg-card-bg/70 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-secondary-text">
          Preview
        </p>
        <div
          className="mt-3 min-h-28 rounded-2xl border border-dashed border-border-color/70 bg-bg px-4 py-4"
          style={{
            color: draft.color,
            fontFamily: `${draft.fontFamily}, sans-serif`,
            fontSize: Math.min(draft.fontSize, 42),
            fontWeight: draft.fontWeight,
            textAlign: draft.align,
          }}
        >
          <div
            style={{
              maxWidth: draft.maxWidth,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {draft.text.trim() || "Your text preview"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAddText}
          disabled={
            !draft.text.trim() || !normalizeBoardTextFamily(draft.fontFamily)
          }
          className="flex-1 rounded-xl bg-title-color px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add text to board
        </button>
        <button
          type="button"
          onClick={handleResetDraft}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-title-color outline outline-border-color/60 transition hover:outline-accent/70"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
