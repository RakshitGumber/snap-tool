import { useState } from "react";

import { Link } from "@/pages/Link";
import { useRouter } from "@/pages/useRouter";
import { useAuthStore } from "@/stores/useAuthStore";
import { Icon } from "@iconify/react";

import { ThemeButton } from "../ui/ThemeButton";

export const Navbar = () => {
  const { setRoute } = useRouter();
  const { session, signOut } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userLabel = session?.user?.name ?? session?.user?.email ?? "Account";

  const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOut();
    setIsSubmitting(false);
  };

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
      <div className="relative flex items-center gap-3">
        <ThemeButton />
        {session?.user ? (
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-text-color/15 bg-white/70 px-3 py-2 text-sm font-semibold text-title-color shadow-sm backdrop-blur-sm">
              {userLabel}
            </span>
            <button
              onClick={() => {
                void handleSignOut();
              }}
              className="font-styled rounded-lg border border-text-color/15 px-3 py-2 text-sm font-bold tracking-[0.2em] uppercase text-title-color transition hover:bg-text-color/10 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? "..." : "Log out"}
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setRoute("/auth/login")}
              className="font-styled rounded-lg border border-text-color/15 px-3 py-2 text-sm font-bold tracking-[0.2em] uppercase text-title-color transition hover:bg-text-color/10"
              type="button"
            >
              Login
            </button>
            <button
              onClick={() => setRoute("/auth/register")}
              className="font-styled rounded-lg border border-text-color/15 px-3 py-2 text-sm font-bold tracking-[0.2em] uppercase text-title-color transition hover:bg-text-color/10"
              type="button"
            >
              Register
            </button>
          </>
        )}
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
