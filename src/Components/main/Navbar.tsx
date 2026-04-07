import { useRouter } from "@/utils/Router";
import { Icon } from "@iconify/react";

export const Navbar = () => {
  const { route, setRoute } = useRouter();

  return (
    <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-2xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <h1 className="font-styled text-xl text-title-color font-bold tracking-wider uppercase select-none cursor-pointer">
          Snap Tool
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRoute("/create")}
            className="gap-2 flex items-center text-lg font-medium text-bg bg-accent"
          >
            Create
            <Icon icon="solar:add-square-outline" className="text-2xl" />
          </button>
        </div>
      </nav>
    </header>
  );
};
