import { useEffect, useState } from "react";
import { Canvas } from "@/Components/panels/Canvas";
import { EffectsMenu } from "@/Components/panels/EffectsMenu";
import { useCreateEditorState } from "@/hooks/useCreateEditorState";
import { type EditorTool } from "@/libs/editorSchema";

export const CreateRoute = () => {
  const {
    activeCanvas,
    activeCanvasId,
    canvases,
    setActiveCanvas,
    setBackgroundFill,
    addItem,
    removeCanvas,
    replaceCanvases,
    replaceDocument,
  } = useCreateEditorState();
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [paintColor, setPaintColor] = useState(activeCanvas.document.bg.fill);

  useEffect(() => {
    setPaintColor(activeCanvas.document.bg.fill);
  }, [activeCanvas.document.bg.fill]);

  return (
    <div className="flex min-h-0 flex-1">
      <EffectsMenu
        activeCanvasId={activeCanvasId}
        activeTool={activeTool}
        canvases={canvases}
        paintColor={paintColor}
        onCanvasSelect={setActiveCanvas}
        onActiveToolChange={setActiveTool}
        onPaintColorChange={setPaintColor}
      />

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
    </div>
  );
};
