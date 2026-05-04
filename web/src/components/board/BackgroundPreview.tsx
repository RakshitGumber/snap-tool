import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { CanvasBackgroundLayer } from "@/canvas/CanvasBackgroundLayer";
import type {
  CanvasBackgroundEffects,
  CanvasBackgroundValue,
} from "@/types/canvas";

type BoardBackgroundPreviewProps = {
  background?: CanvasBackgroundValue | null;
  effects?: Partial<CanvasBackgroundEffects> | null;
  imageSrc?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  className?: string;
};

export const BoardBackgroundPreview = ({
  background,
  effects,
  imageSrc,
  imageWidth,
  imageHeight,
  className,
}: BoardBackgroundPreviewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
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
