import { useEffect, useRef, useState } from "react";

import type { CanvasSize } from "@/config/canvasPresets";
import type { CanvasComposition } from "@/libs/canvasComposition";

import { PixiCompositionPreview } from "../cards/PixiCompositionPreview";

export const CompositionPreview = ({
  composition,
  canvasSize,
  activeBackgroundId,
}: {
  composition: CanvasComposition;
  canvasSize: CanvasSize;
  activeBackgroundId: string;
}) => {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(320);

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
      style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }}
    >
      <PixiCompositionPreview
        composition={composition}
        width={width}
        canvasSize={canvasSize}
        activeBackgroundId={activeBackgroundId}
      />
    </div>
  );
};

