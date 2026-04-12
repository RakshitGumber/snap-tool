import {
  useEffect,
  useMemo,
  type ReactNode,
  type AnchorHTMLAttributes,
} from "react";
import { create } from "zustand";

import { LoginRoute } from "./user/login";
import { RegisterRoute } from "./user/register";
import { CreateRoute } from "./create";
import { RootRoute } from "./root";
import { PageNotFound } from "./not-found";

import { useAuthStore } from "@/stores/useAuthStore";

interface RouterState {
  route: string;
  setRoute: (path: string) => void;
}

interface RouteConfig {
  path: string;
  element: ReactNode;
  isProtected?: boolean;
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export const useRouter = create<RouterState>((set) => ({
  route: window.location.pathname,
  setRoute: (path) => {
    window.history.pushState({}, "", path);
    set({ route: path });
  },
}));

const ROUTES: RouteConfig[] = [
  { path: "/", element: <RootRoute /> },
  { path: "/create", element: <CreateRoute />, isProtected: true },
  { path: "/auth/login", element: <LoginRoute /> },
  { path: "/auth/register", element: <RegisterRoute /> },
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
  const route = useRouter((state) => state.route);
  const setRoute = useRouter((state) => state.setRoute);

  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const refreshSession = useAuthStore((state) => state.refreshSession);

  useEffect(() => {
    const handlePopState = () => {
      useRouter.setState({ route: window.location.pathname });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const activeRoute = useMemo(
    () => ROUTES.find((r) => matchRoute(route, r.path)),
    [route],
  );

  useEffect(() => {
    if (activeRoute?.isProtected && !isLoading && !session) {
      setRoute("/auth/login");
    }
  }, [activeRoute?.isProtected, isLoading, session, setRoute]);

  if (!activeRoute) {
    return <PageNotFound />;
  }

  if (activeRoute.isProtected) {
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      );
    }

    if (!session) {
      return null;
    }
  }

  return <div className="flex flex-col">{activeRoute.element}</div>;
};

export const Link = ({
  to,
  children,
  className,
  onClick,
  ...props
}: LinkProps) => {
  const setRoute = useRouter((state) => state.setRoute);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(event);

    if (event.ctrlKey || event.metaKey || event.button !== 0) return;

    event.preventDefault();
    setRoute(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
};
