import { Link } from "@/pages/Router";
import { useAuthStore } from "@/stores/useAuthStore";

import { Icon } from "@iconify/react";

import { ThemeButton } from "../ui/ThemeButton";

export const Navbar = () => {
  const { session } = useAuthStore();

  return (
    <header className="h-18 bg-card-bg border-b-2 border-accent dark:border-accent/70 w-full fixed top-0 z-20 flex justify-center">
      <nav className="max-w-7xl flex items-center justify-between p-6 flex-1">
        <Link className="rounded-lg flex items-center cursor-pointer" to="/">
          <h1 className="font-heading text-2xl text-title-color hover:text-accent font-medium tracking-widest capitalize select-none">
            Single Filter
          </h1>
        </Link>
        <ul className="flex gap-4">
          <li className="flex px-4 py-2 hover:bg-text-color/20 cursor-pointer rounded-lg">
            <Link to="/">Home</Link>
          </li>
          <li className="flex px-4 py-2 hover:bg-text-color/20 cursor-pointer rounded-lg">
            <Link to="/about">About</Link>
          </li>
          <li className="flex px-4 py-2 hover:bg-text-color/20 cursor-pointer rounded-lg">
            <Link to="/contribute">Contribute</Link>
          </li>
        </ul>
        <div className="relative flex items-center gap-3">
          <div className="flex gap-2">
            <a
              href="https://github.com/RakshitGumber/snap-tool"
              className="rounded-lg font-semibold hover:bg-accent-light items-center flex gap-1 text-xl p-2 text-title-color"
            >
              <Icon icon="simple-icons:github" />
            </a>
            <ThemeButton />
          </div>
          {session?.user ? (
            <Link
              to="/create"
              className="rounded-lg font-semibold hover:bg-accent-light items-center flex gap-1 text-xl px-3 py-1 hover:text-title-color"
            >
              <span className="text-lg text-title-color">Create</span>
              <Icon
                icon="ooui:link-external-ltr"
                className="text-accent mb-0.5"
              />
            </Link>
          ) : (
            <Link
              to="/auth/register"
              className="font-styled px-3 py-2 rounded-lg gap-2 flex items-center justify-center font-semibold text-bg tracking-wide bg-accent cursor-pointer"
            >
              Register
              <Icon icon="solar:add-square-broken" className="text-xl" />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
