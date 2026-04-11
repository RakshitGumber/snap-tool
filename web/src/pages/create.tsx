import { TopPanel } from "@/Components/panels/TopPanel";
import { Canvas } from "@/Components/panels/Canvas";
import { CreateSidebar } from "@/Components/panels/EffectsMenu";
import { CreateToolbar } from "@/Components/toolkits/CreateToolbar";
import { useCreateEditorState } from "@/hooks/useCreateEditorState";
import { useAuthStore } from "@/stores/useAuthStore";

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
  } = useCreateEditorState();
  const { isLoading, session } = useAuthStore();

  const sessionLabel = isLoading
    ? "Session loading"
    : session?.user?.email ?? session?.user?.name ?? "Guest session";

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
    <div className="flex min-h-[calc(100vh-0px)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,244,217,0.8),_transparent_30%),linear-gradient(180deg,rgba(244,246,255,1),rgba(239,242,255,0.95))]">
      <TopPanel>
        <CreateToolbar
          aspectRatio={canvases.find((canvas) => canvas.id === activeCanvasId)?.ratio ?? "1:1"}
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
      </TopPanel>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        {!isPreviewMode ? (
          <CreateSidebar
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
            onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
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
