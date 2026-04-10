import { Navbar } from "@/Components/main/Navbar";
import { CreateRoute } from "@/pages/create";
import { RootRoute } from "@/pages/root";
import { useEffect, type JSX } from "react";
import { create } from "zustand";

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

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
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
