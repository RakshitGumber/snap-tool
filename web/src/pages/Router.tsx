import {
  Suspense,
  lazy,
  startTransition,
  useEffect,
  useMemo,
  type AnchorHTMLAttributes,
  type LazyExoticComponent,
  type MouseEvent,
  type ReactElement,
} from "react";

import { create } from "zustand";

interface RouterState {
  route: string;
  setRoute: (path: string) => void;
}

export const useRouter = create<RouterState>((set) => ({
  route: window.location.pathname,
  setRoute: (path) => {
    window.history.pushState({}, "", path);
    startTransition(() => {
      set({ route: path });
    });
  },
}));

type RouteComponent = LazyExoticComponent<() => ReactElement>;

interface RouteConfig {
  path: string;
  element: RouteComponent;
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

const RootRoute = lazy(async () => {
  const mod = await import("./root");
  return { default: mod.RootRoute };
});

const CreateRoute = lazy(async () => {
  const mod = await import("./create");
  return { default: mod.CreateRoute };
});

const PageNotFound = lazy(async () => {
  const mod = await import("./not-found");
  return { default: mod.NotFound };
});

const ROUTES: RouteConfig[] = [
  { path: "/", element: RootRoute },
  { path: "/create", element: CreateRoute },
];

const matchRoute = (currentPath: string, routeDef: string): boolean => {
  if (currentPath === routeDef) return true;

  if (routeDef.endsWith("/*")) {
    const base = routeDef.slice(0, -2);
    return currentPath.startsWith(base);
  }

  const currentSegments = currentPath.split("/").filter(Boolean);
  const routeSegments = routeDef.split("/").filter(Boolean);

  if (currentSegments.length !== routeSegments.length) return false;

  return routeSegments.every(
    (segment, i) => segment.startsWith(":") || segment === currentSegments[i],
  );
};

const isLocalRoute = (to: string) => {
  const targetUrl = new URL(to, window.location.href);
  return targetUrl.origin === window.location.origin;
};

export const Router = () => {
  const route = useRouter((state) => state.route);

  useEffect(() => {
    const handlePopState = () => {
      startTransition(() => {
        useRouter.setState({ route: window.location.pathname });
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const activeRoute = useMemo(
    () => ROUTES.find((currentRoute) => matchRoute(route, currentRoute.path)),
    [route],
  );

  const ActiveRoute = activeRoute?.element ?? PageNotFound;

  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <ActiveRoute />
    </Suspense>
  );
};

export const Link = ({
  to,
  children,
  className,
  onClick,
  target,
  download,
  rel,
  ...props
}: LinkProps) => {
  const setRoute = useRouter((state) => state.setRoute);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    if (target && target !== "_self") return;
    if (download) return;
    if (!isLocalRoute(to)) return;

    event.preventDefault();
    setRoute(new URL(to, window.location.href).pathname);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={className}
      target={target}
      download={download}
      rel={rel}
      {...props}
    >
      {children}
    </a>
  );
};
