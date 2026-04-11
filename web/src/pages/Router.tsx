import { TopPanel } from "@/Components/panels/TopPanel";
import { CreateRoute } from "@/pages/create";
import { RootRoute } from "@/pages/root";
import { useEffect, useState, type JSX } from "react";
import { create } from "zustand";

import { Navbar } from "@/Components/main/Navbar";
import { CreateToolbar } from "@/Components/toolkits/CreateToolbar";
import type { EditorTool } from "@/libs/editorSchema";
import { useCreateEditorState } from "@/hooks/useCreateEditorState";

interface useRouter {
  route: RoutePath;
  setRoute: (path: RoutePath) => void;
}

export type RoutePath = "/" | "/create";

const directory: Record<RoutePath, JSX.Element> = {
  "/": <RootRoute />,
  "/create": <CreateRoute />,
};

export const useRouter = create<useRouter>((set) => ({
  route: window.location.pathname as RoutePath,
  setRoute: (path) => {
    window.history.pushState({}, "", path);
    set({ route: path });
  },
}));

export const Router = () => {
  const { route } = useRouter();

  useEffect(() => {
    const handler = () => {
      useRouter.setState({
        route: window.location.pathname as RoutePath,
      });
    };

    window.addEventListener("popstate", handler);

    return () => window.removeEventListener("popstate", handler);
  }, []);

  const { activeCanvas, addCanvas, setRatio } = useCreateEditorState();
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [paintColor, _] = useState(activeCanvas.document.bg.fill);

  return (
    <div className="flex flex-col">
      <TopPanel>
        {route === "/" ? (
          <Navbar />
        ) : (
          <CreateToolbar
            aspectRatio={activeCanvas.ratio}
            activeTool={activeTool}
            paintColor={paintColor}
            onAspectRatioChange={setRatio}
            onAddCanvas={addCanvas}
            onActiveToolChange={setActiveTool}
          />
        )}
      </TopPanel>
      <main>{directory[route]}</main>
    </div>
  );
};

export const Link = ({
  to,
  children,
  className,
  type = "button",
}: {
  to: RoutePath;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}) => {
  const { setRoute } = useRouter();

  return (
    <button className={className} onClick={() => setRoute(to)} type={type}>
      {children}
    </button>
  );
};
