import {
  useEffect,
  useMemo,
  type ReactNode,
  type AnchorHTMLAttributes,
} from "react";

import { CreateRoute } from "./create";
import { RootRoute } from "./root";
import { PageNotFound } from "./not-found";
import { useRouter } from "./routerStore";

interface RouteConfig {
  path: string;
  element: ReactNode;
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

const ROUTES: RouteConfig[] = [
  { path: "/", element: <RootRoute /> },
  { path: "/create", element: <CreateRoute /> },
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

  useEffect(() => {
    const handlePopState = () => {
      useRouter.setState({ route: window.location.pathname });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const activeRoute = useMemo(
    () => ROUTES.find((r) => matchRoute(route, r.path)),
    [route],
  );

  if (!activeRoute) {
    return <PageNotFound />;
  }

  return <>{activeRoute.element}</>;
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
