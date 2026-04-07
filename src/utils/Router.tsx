import { CreateRoute } from "@/pages/create";
import { RootRoute } from "@/pages/root";
import { useEffect, type JSX } from "react";
import { create } from "zustand";

interface useRouter {
  route: RoutePath;
  setRoute: (path: RoutePath) => void;
}

type RoutePath = "/" | "/create";

const directory: Record<RoutePath, JSX.Element> = {
  "/": <RootRoute />,
  "/create": <CreateRoute />,
};

const useRouter = create<useRouter>((set) => ({
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

  return <div>{directory[route]}</div>;
};

export const Link = ({
  to,
  children,
}: {
  to: RoutePath;
  children: React.ReactNode;
}) => {
  const { setRoute } = useRouter();

  return <button onClick={() => setRoute(to)}>{children}</button>;
};
