import { LinkCardRenderer } from "@/components/cards/LinkCardRenderer";
import { getLinkCardPresetById } from "@/config/linkCardPresets";
import type {
  LinkCardCanvasItem,
} from "@/stores/useCanvasStore";

export const CenteredCard = ({
  card,
  canvasWidth,
  scale,
  onResizeStart,
}: {
  card: LinkCardCanvasItem;
  canvasWidth: number;
  scale: number;
  onResizeStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) => {
  const preset = getLinkCardPresetById(card.presetId);
  const renderedWidth = Math.max(1, canvasWidth * card.widthRatio * scale);
  const renderedHeight = Math.max(1, renderedWidth / preset.aspectRatio);

  return (
    <div
      className="absolute left-1/2 top-1/2 overflow-visible"
      style={{
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="rounded-lg">
        <LinkCardRenderer
          preset={preset}
          metadata={card.metadata}
          width={renderedWidth}
          height={renderedHeight}
        />
      </div>
      <button
        type="button"
        onPointerDown={onResizeStart}
        aria-label="Resize centered card"
        className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full border bg-accent"
      />
    </div>
  );
};
