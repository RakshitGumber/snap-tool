import { Link, useRouter } from "@/pages/Router";
import { Icon } from "@iconify/react";
import { ThemeButton } from "../ui/ThemeButton";

export const Navbar = () => {
  const { setRoute } = useRouter();

  return (
    <nav className="max-w-7xl mx-auto flex h-full w-full items-center justify-between p-3">
      <button
        className="hover:bg-text-color/20 rounded-lg flex items-center py-2 px-4 cursor-pointer"
        onClick={() => setRoute("/")}
      >
        <h1 className="font-styled text-2xl text-title-color font-semibold tracking-wide uppercase select-none">
          Single Filter
        </h1>
      </button>
      <ul className="flex gap-4">
        <li className="flex px-4 py-2 hover:bg-text-color/20 cursor-pointer rounded-lg">
          <Link to="/">Home</Link>
        </li>
        <li className="flex px-4 py-2 hover:bg-text-color/20 cursor-pointer rounded-lg">
          <Link to="/">Home</Link>
        </li>
        <li className="flex px-4 py-2 hover:bg-text-color/20 cursor-pointer rounded-lg">
          <Link to="/">Home</Link>
        </li>
      </ul>
      <div className="flex items-center gap-3">
        <ThemeButton />
        <button
          onClick={() => setRoute("/create")}
          className="font-styled px-3 py-2 rounded-lg gap-1 flex items-center justify-center font-bold text-bg tracking-widest bg-accent cursor-pointer min-w-28"
        >
          Create
          <Icon icon="solar:add-square-broken" className="text-xl" />
        </button>
      </div>
    </nav>
  );
};
