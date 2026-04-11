import { useRouter } from "@/utils/Router";
import { Icon } from "@iconify/react";
import { TopPanel } from "../panels/TopPanel";
import { ThemeButton } from "../ui/ThemeButton";

export const Navbar = () => {
  const { route, setRoute } = useRouter();

  return (
    <TopPanel>
      <nav className="max-w-7xl mx-auto flex h-full w-full items-center justify-between p-3">
        <button
          className="hover:bg-text-color/20 rounded-lg flex items-center py-2 px-4 cursor-pointer"
          onClick={() => setRoute("/")}
        >
          <h1 className="font-styled text-2xl text-title-color font-semibold tracking-wide uppercase select-none">
            Single Filter
          </h1>
        </button>
        <div className="flex items-center gap-3">
          <ThemeButton />
          {route == "/" ? (
            <button
              onClick={() => setRoute("/create")}
              className="font-styled px-3 py-2 rounded-lg gap-1 flex items-center justify-center font-bold text-bg tracking-widest bg-accent cursor-pointer min-w-28"
            >
              Create
              <Icon icon="solar:add-square-broken" className="text-xl" />
            </button>
          ) : (
            <button
              onClick={() => console.log("share triggred")}
              className="font-styled px-3 py-2 rounded-lg gap-1 flex items-center justify-center font-bold text-bg tracking-widest bg-accent cursor-pointer min-w-28"
            >
              Share
              <Icon icon="solar:share-broken" className="text-xl" />
            </button>
          )}
        </div>
      </nav>
    </TopPanel>
  );
};
