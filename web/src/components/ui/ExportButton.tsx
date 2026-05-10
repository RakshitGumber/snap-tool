import { Icon } from "@iconify/react";
import { useCallback } from "react";

import { useCanvasExport } from "@/providers/CanvasExportContext";

export const ExportButton = () => {
  const { exportCanvas, isExporting } = useCanvasExport();

  const handleDownload = useCallback(async () => {
    try {
      await exportCanvas();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save the board.";

      console.log(message);
    }
  }, [exportCanvas]);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-bg disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isExporting}
        onClick={() => void handleDownload()}
      >
        <div className="text-base font-semibold leading-3">
          {isExporting ? "Exporting" : "Export"}
        </div>
        <Icon icon="mingcute:external-link-line" fontSize={18} />
      </button>
    </div>
  );
};
