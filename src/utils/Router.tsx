import { CreateRoute } from "@/pages/create";
import { RootRoute } from "@/pages/root";
import { create } from "zustand";

interface useRouter {
  route: string;
  setRoute: (path: string) => void;
}

const useRouter = create<useRouter>((set) => ({
  route: window.location.pathname,
  setRoute: (path) => {
    window.location.pathname = path;
    set({ route: path });
  },
}));

export const Router = () => {
  const { route } = useRouter();
  return <div>{route}</div>;
};

export const Link = ({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) => {
  const { setRoute } = useRouter();

  return <button onClick={() => setRoute(to)}>{children}</button>;
};
