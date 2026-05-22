import { useEffect, useRef, useState, type FormEvent } from "react";

import { resolveLinkCardMetadata } from "@/libs/linkCards";
import { useCanvasStore } from "@/stores/useCanvasStore";

export const Images = () => {
  const generationRef = useRef(0);
  const didAutoFetchRef = useRef(false);
  const initialUrlRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const [error, setError] = useState<string | null>(null);

  const setActiveYouTubeComposition = useCanvasStore(
    (state) => state.setActiveYouTubeComposition,
  );

  useEffect(() => {
    // Supports deep-linking from the landing hero: /create?url=...
    // We keep it resilient (no throw, no navigation) and one-shot to avoid loops.
    const params = new URLSearchParams(window.location.search);
    const initialUrl = params.get("url")?.trim();
    if (!initialUrl) return;
    if (urlInput.trim().length) return;

    initialUrlRef.current = initialUrl;
    setUrlInput(initialUrl);
  }, [urlInput]);

  useEffect(() => {
    const initial = initialUrlRef.current;
    if (!initial) return;
    if (didAutoFetchRef.current) return;
    if (urlInput.trim() !== initial) return;

    didAutoFetchRef.current = true;
    formRef.current?.requestSubmit();
  }, [urlInput]);

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const generationId = generationRef.current + 1;
    generationRef.current = generationId;
    setStatus("generating");
    setError(null);

    try {
      const metadata = await resolveLinkCardMetadata(urlInput);

      if (generationRef.current !== generationId) return;

      if (metadata.source !== "youtube") {
        throw new Error("Only YouTube links can be placed on the canvas for now.");
      }

      setActiveYouTubeComposition(metadata);
      setStatus("idle");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to generate a canvas.";

      if (generationRef.current !== generationId) return;

      setError(message);
      setStatus("idle");
    }
  };

  return (
    <form onSubmit={handleGenerate} className="flex flex-col gap-2" ref={formRef}>
      <div className="flex gap-2">
        <input
          id="link-card-url"
          type="text"
          inputMode="url"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="Enter a YouTube link"
          className="min-w-0 h-10 flex-1 rounded-lg border border-border-color bg-bg px-3 py-2 text-sm text-title-color placeholder:text-secondary-text focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "generating"}
          className="rounded-lg h-10 bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "generating" ? "Fetching" : "Fetch"}
        </button>
      </div>
      {error ? <p className="text-xs font-semibold text-red-400">{error}</p> : null}
    </form>
  );
};
