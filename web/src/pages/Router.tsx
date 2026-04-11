/* eslint-disable react-refresh/only-export-components */
import { CreateRoute } from "@/pages/create";
import { RootRoute } from "@/pages/root";
import { useEffect, type JSX, type ReactNode } from "react";
import { create } from "zustand";

import { TopPanel } from "@/Components/panels/TopPanel";
import { Navbar } from "@/Components/main/Navbar";
import { useAuthStore } from "@/stores/useAuthStore";

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
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const handler = () => {
      useRouter.setState({
        route: window.location.pathname as RoutePath,
      });
    };

    window.addEventListener("popstate", handler);

    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <div className="flex flex-col">
      {route === "/" ? (
        <TopPanel>
          <Navbar />
        </TopPanel>
      ) : null}
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
  children: ReactNode;
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
