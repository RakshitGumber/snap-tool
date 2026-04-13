import { Canvas } from "@/Components/panels/Canvas";
import { DesignPanel } from "@/Components/panels/DesignPanel";
import { CreateToolbar } from "@/Components/toolkits/CreateToolbar";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCreateEditorStore } from "@/stores/useCreateEditorStore";

export const CreateRoute = () => {
  const {
    activeCanvasId,
    activeSidebarTab,
    activeTool,
    canvases,
    addItem,
    clearCanvas,
    isPreviewMode,
    isSidebarCollapsed,
    paintColor,
    sidebarWidth,
    setActiveCanvas,
    setActiveSidebarTab,
    setActiveTool,
    setBackgroundFill,
    setIsPreviewMode,
    setIsSidebarCollapsed,
    setPaintColor,
    setRatio,
    setSidebarWidth,
    addCanvas,
    removeCanvas,
    replaceCanvases,
    replaceDocument,
  } = useCreateEditorStore();
  const { isLoading, session } = useAuthStore();

  const sessionLabel = isLoading
    ? "Session loading"
    : (session?.user?.email ?? session?.user?.name ?? "Guest session");

  const handleShare = async () => {
    const snapshot = {
      activeCanvasId,
      canvases,
      createdAt: new Date().toISOString(),
    };
    const text = JSON.stringify(snapshot, null, 2);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Snap Tool design",
          text,
          url: window.location.href,
        });
        return;
      } catch {
        // Fall through to clipboard copy.
      }
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // No-op if clipboard access is not available.
    }
  };

  return (
    <div className="h-screen">
      <CreateToolbar
        aspectRatio={
          canvases.find((canvas) => canvas.id === activeCanvasId)?.ratio ??
          "1:1"
        }
        activeTool={activeTool}
        isPreviewMode={isPreviewMode}
        isSidebarCollapsed={isSidebarCollapsed}
        sessionLabel={sessionLabel}
        onAspectRatioChange={setRatio}
        onAddCanvas={addCanvas}
        onActiveToolChange={setActiveTool}
        onCleanCanvas={() => clearCanvas(activeCanvasId)}
        onPreviewToggle={() => setIsPreviewMode((current) => !current)}
        onShare={() => {
          void handleShare();
        }}
        onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
      />

      <main className="flex h-[calc(100vh-65px)]">
        {!isPreviewMode ? (
          <DesignPanel
            activeCanvasId={activeCanvasId}
            activeSidebarTab={activeSidebarTab}
            activeTool={activeTool}
            canvases={canvases}
            paintColor={paintColor}
            sidebarWidth={sidebarWidth}
            isCollapsed={isSidebarCollapsed}
            onActiveSidebarTabChange={setActiveSidebarTab}
            onActiveToolChange={setActiveTool}
            onBackgroundFill={setBackgroundFill}
            onCanvasSelect={setActiveCanvas}
            onPaintColorChange={setPaintColor}
            onSidebarWidthChange={setSidebarWidth}
            onToggleCollapsed={() =>
              setIsSidebarCollapsed((current) => !current)
            }
          />
        ) : null}

        <Canvas
          activeCanvasId={activeCanvasId}
          activeTool={activeTool}
          canvases={canvases}
          paintColor={paintColor}
          onActivateCanvas={setActiveCanvas}
          onDropAsset={(canvasId, payload, point) => {
            setActiveCanvas(canvasId);
            addItem(canvasId, payload, point);
            setActiveTool("select");
          }}
          onApplyPaint={(canvasId, color) => {
            setActiveCanvas(canvasId);
            setBackgroundFill(color, canvasId);
          }}
          onCanvasesChange={replaceCanvases}
          onDeleteCanvas={removeCanvas}
          onDocumentChange={replaceDocument}
        />
      </main>
    </div>
  );
};
