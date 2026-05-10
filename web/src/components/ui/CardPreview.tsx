import { useEffect, useRef, useState } from "react";

import { getLinkCardPresetById } from "@/config/linkCardPresets";
import { PixiCardPreview } from "@/components/cards/PixiCardPreview";
import type { LinkCardCanvasItem } from "@/stores/useCanvasStore";

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
    <div ref={previewRef} style={{ aspectRatio: preset.aspectRatio }}>
      <PixiCardPreview card={card} width={width} />
    </div>
  );
};
