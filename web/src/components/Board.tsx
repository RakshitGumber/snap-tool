import { useEffect, useRef } from "react";

import { BoardSidebar } from "@/components/board/Sidebar";
import { TopRibbon } from "@/components/board/TopRibbon";
import { Canvas } from "@/canvas/Canvas";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { pushToast } from "@/stores/useToastStore";
import { useUploadLibraryStore } from "@/stores/useUploadLibraryStore";

export const Board = () => {
  const initializeDefaultCanvas = useCanvasStore(
    (state) => state.initializeDefaultCanvas,
  );
  const hydrateLibrary = useUploadLibraryStore((state) => state.hydrateLibrary);
  const uploadLibraryStatus = useUploadLibraryStore((state) => state.status);
  const uploadLibraryError = useUploadLibraryStore((state) => state.lastError);
  const previousUploadLibraryStatusRef = useRef(uploadLibraryStatus);

  useEffect(() => {
    initializeDefaultCanvas();
  }, [initializeDefaultCanvas]);

  useEffect(() => {
    if (uploadLibraryStatus !== "idle") {
      return;
    }

    void hydrateLibrary();
  }, [hydrateLibrary, uploadLibraryStatus]);

  useEffect(() => {
    if (
      uploadLibraryStatus === "error" &&
      previousUploadLibraryStatusRef.current !== "error"
    ) {
      pushToast({
        variant: "error",
        title: "Upload library unavailable",
        message:
          uploadLibraryError ?? "Unable to restore your upload library.",
      });
    }

    previousUploadLibraryStatusRef.current = uploadLibraryStatus;
  }, [uploadLibraryError, uploadLibraryStatus]);

  return (
    <main className="flex h-screen flex-col">
      <TopRibbon />
      <div className="flex min-h-0 flex-1">
        <BoardSidebar />
        <section className="relative min-w-0 flex-1">
          <Canvas />
        </section>
      </div>
    </main>
  );
};
