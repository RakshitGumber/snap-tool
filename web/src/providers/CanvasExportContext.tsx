/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type CanvasExporter = () => Promise<void>;

type CanvasExportContextValue = {
  exportCanvas: () => Promise<void>;
  isExporting: boolean;
  registerExporter: (exporter: CanvasExporter | null) => () => void;
};

const CanvasExportContext = createContext<CanvasExportContextValue | null>(null);

export const CanvasExportProvider = ({ children }: { children: ReactNode }) => {
  const exporterRef = useRef<CanvasExporter | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const registerExporter = useCallback((exporter: CanvasExporter | null) => {
    exporterRef.current = exporter;

    return () => {
      if (exporterRef.current === exporter) exporterRef.current = null;
    };
  }, []);

  const exportCanvas = useCallback(async () => {
    if (!exporterRef.current || isExporting) return;

    setIsExporting(true);

    try {
      await exporterRef.current();
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const value = useMemo(
    () => ({
      exportCanvas,
      isExporting,
      registerExporter,
    }),
    [exportCanvas, isExporting, registerExporter],
  );

  return (
    <CanvasExportContext.Provider value={value}>
      {children}
    </CanvasExportContext.Provider>
  );
};

export const useCanvasExport = () => {
  const value = useContext(CanvasExportContext);

  if (!value) {
    throw new Error("useCanvasExport must be used inside CanvasExportProvider.");
  }

  return value;
};
