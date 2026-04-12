import { useEffect, useMemo, type ReactNode } from "react";

import { LoginRoute } from "./user/login";
import { RegisterRoute } from "./user/register";
import { CreateRoute } from "./create";
import { RootRoute } from "./root";
import { PageNotFound } from "./not-found";

import { useAuthStore } from "@/stores/useAuthStore";

import { create } from "zustand";

interface RouterState {
  route: string;
  setRoute: (path: string) => void;
}

export const useRouter = create<RouterState>((set) => ({
  route: window.location.pathname,
  setRoute: (path) => {
    window.history.pushState({}, "", path);
    set({ route: path });
  },
}));

interface RouteConfig {
  path: string;
  element: ReactNode;
  isProtected?: boolean;
}

const ROUTES: RouteConfig[] = [
  { path: "/", element: <RootRoute /> },
  {
    path: "/create",
    element: <CreateRoute />,
    isProtected: true,
  },
  {
    path: "/auth/login",
    element: <LoginRoute />,
  },
  {
    path: "/auth/register",
    element: <RegisterRoute />,
  },
];

const matchRoute = (currentPath: string, routeDef: string): boolean => {
  if (currentPath === routeDef) return true;

  // Handle wildcards (e.g., "/settings/*")
  if (routeDef.endsWith("/*")) {
    const base = routeDef.slice(0, -2);
    return currentPath.startsWith(base);
  }

  // Handle params (e.g., "/user/:id")
  const currentSegments = currentPath.split("/").filter(Boolean);
  const routeSegments = routeDef.split("/").filter(Boolean);

  if (currentSegments.length !== routeSegments.length) return false;

  return routeSegments.every(
    (segment, i) => segment.startsWith(":") || segment === currentSegments[i],
  );
};

export const Router = () => {
  const { route, setRoute } = useRouter();

  const { session, isLoading } = useAuthStore((state) => state);

  useEffect(() => {
    const handlePopState = () =>
      useRouter.setState({ route: window.location.pathname });
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const activeRoute = useMemo(
    () => ROUTES.find((r) => matchRoute(route, r.path)),
    [route],
  );

  useEffect(() => {
    if (activeRoute?.isProtected && !isLoading && !session) {
      setRoute("/auth/login");
    }
  }, [activeRoute, isLoading, session, setRoute]);

  if (!activeRoute) {
    return <PageNotFound />;
  }

  if (activeRoute.isProtected && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return <main className="flex flex-col">{activeRoute.element}</main>;
};
