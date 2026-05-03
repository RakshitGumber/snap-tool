import clsx from "clsx";

import {
  buildCanvasBackgroundFilter,
  getCanvasBackgroundBlurPadding,
  getCanvasBackgroundOpacity,
  normalizeCanvasBackgroundEffects,
} from "@/canvas/backgroundEffects";
import type { CanvasBackgroundEffects } from "@/types/canvas";

type BoardBackgroundPreviewProps = {
  background?: string | null;
  effects?: Partial<CanvasBackgroundEffects> | null;
  className?: string;
};

export const BoardBackgroundPreview = ({
  background,
  effects,
  className,
}: BoardBackgroundPreviewProps) => {
  const normalizedEffects = normalizeCanvasBackgroundEffects(effects);
  const blurPadding = getCanvasBackgroundBlurPadding(normalizedEffects);

  return (
    <div className={clsx("relative overflow-hidden bg-white", className)}>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute"
          style={{
            top: -blurPadding,
            right: -blurPadding,
            bottom: -blurPadding,
            left: -blurPadding,
            background: background ?? "#ffffff",
            filter: buildCanvasBackgroundFilter(normalizedEffects),
            opacity: getCanvasBackgroundOpacity(normalizedEffects),
          }}
        />
      </div>
    </div>
  );
};
