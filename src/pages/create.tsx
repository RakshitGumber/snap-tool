import { useEffect, useState } from "react";
import { Canvas } from "@/Components/main/Canvas";
import { CreateToolbar } from "@/Components/main/CreateToolbar";
import { EffectsMenu } from "@/Components/main/EffectsMenu";
import { useCreateEditorState } from "@/hooks/useCreateEditorState";
import { type EditorTool } from "@/libs/editorSchema";

export const CreateRoute = () => {
  const { ratio, document, setRatio, setBackgroundFill, addItem, replaceDocument } =
    useCreateEditorState();
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [paintColor, setPaintColor] = useState(document.bg.fill);

  useEffect(() => {
    setPaintColor(document.bg.fill);
  }, [document.bg.fill]);

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <CreateToolbar
        aspectRatio={ratio}
        activeTool={activeTool}
        paintColor={paintColor}
        onAspectRatioChange={setRatio}
        onActiveToolChange={setActiveTool}
      />

      <div className="flex min-h-0 flex-1">
        <EffectsMenu
          activeTool={activeTool}
          paintColor={paintColor}
          onActiveToolChange={setActiveTool}
          onPaintColorChange={setPaintColor}
        />

        <Canvas
          aspectRatio={ratio}
          document={document}
          activeTool={activeTool}
          paintColor={paintColor}
          onDropAsset={(payload, point) => {
            addItem(payload, point);
            setActiveTool("select");
          }}
          onApplyPaint={(color) => {
            setBackgroundFill(color);
          }}
          onDocumentChange={replaceDocument}
        />
      </div>
    </div>
  );
};
