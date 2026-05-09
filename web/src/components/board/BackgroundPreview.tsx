// Review note: Small reusable background swatch used by preset and active-background controls.
// The comments in this file are intentionally dense to support the requested review pass.

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { CanvasBackgroundLayer } from "@/canvas/CanvasBackgroundLayer";
import type {
  CanvasBackgroundEffects,
  CanvasBackgroundValue,
} from "@/types/canvas";

/**
 * Documents the board background preview props contract used by the surrounding feature.
 */
type BoardBackgroundPreviewProps = {
  background?: CanvasBackgroundValue | null;
  effects?: Partial<CanvasBackgroundEffects> | null;
  imageSrc?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  className?: string;
};

/**
 * Renders a small preview swatch for the supplied background value.
 */
export const BoardBackgroundPreview = ({
  background,
  effects,
  imageSrc,
  imageWidth,
  imageHeight,
  className,
}: BoardBackgroundPreviewProps) => {
  // Store mutable interaction state in a ref so pointer handlers can read it without re-rendering.
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Keep this local UI state in React because it only affects the current component instance.
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    // Guard this branch so missing or invalid state does not flow into the main path.
    if (!element) {
      // Return the resolved value to the caller after all guards and transformations.
      return;
    }

    const updateSize = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      // Return the resolved value to the caller after all guards and transformations.
      return;
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={clsx("relative overflow-hidden bg-white", className)}
    >
      {background && size.width > 0 && size.height > 0 ? (
        <CanvasBackgroundLayer
          width={size.width}
          height={size.height}
          background={background}
          effects={effects}
          imageSrc={imageSrc}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
        />
      ) : null}
    </div>
  );
};
