import { LinkCardRenderer } from "@/components/cards/LinkCardRenderer";
import { getLinkCardPresetById } from "@/config/linkCardPresets";
import type { LinkCardCanvasItem } from "@/stores/useCanvasStore";
import { useEffect, useRef, useState } from "react";

export const CardPreview = ({ card }: { card: LinkCardCanvasItem }) => {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(320);
  const preset = getLinkCardPresetById(card.presetId);

  useEffect(() => {
    if (!previewRef.current) return;

    const updateWidth = () => {
      if (!previewRef.current) return;

      setWidth(previewRef.current.getBoundingClientRect().width);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(previewRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={previewRef}
      className="overflow-hidden"
      style={{ aspectRatio: preset.aspectRatio }}
    >
      <LinkCardRenderer
        preset={preset}
        metadata={card.metadata}
        width={width}
        height={width / preset.aspectRatio}
      />
    </div>
  );
};
