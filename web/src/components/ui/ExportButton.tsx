import { Icon } from "@iconify/react";
import { useCallback } from "react";

import {
  createLightweightCanvasExport,
  downloadLightweightCanvasExport,
} from "@/canvas/exportLightweightCanvasImage";

export const ExportButton = () => {
  const handleDownload = useCallback(async () => {
    try {
      const exportResult = await createLightweightCanvasExport();
      downloadLightweightCanvasExport(exportResult);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save the board.";
      console.log(message);
    }
  }, []);

  return (
    <div className="relative">
      <button
        className="gap-2 flex px-5 py-3 items-center text-bg bg-accent rounded-md"
        onClick={() => handleDownload()}
      >
        <div className="text-base leading-3 font-semibold">Export</div>
        <Icon icon="mingcute:external-link-line" fontSize={18} />
      </button>
    </div>
  );
};
