import { useState, type FormEvent } from "react";

import { Link, useRouter } from "@/pages/Router";
import { useAuthStore } from "@/stores/useAuthStore";
import { Icon } from "@iconify/react";

import { ThemeButton } from "../ui/ThemeButton";

export const Navbar = () => {
  const { setRoute } = useRouter();
  const { isLoading, session, signIn, signOut } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const userLabel = session?.user?.name ?? session?.user?.email ?? "Account";

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setAuthError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    const nextSession = await signIn({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (!nextSession?.user) {
      setAuthError("Login failed. Check your credentials and try again.");
      return;
    }

    setPassword("");
    setIsAuthPanelOpen(false);
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOut();
    setIsSubmitting(false);
    setIsAuthPanelOpen(false);
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
              onClick={() => {
                setAuthError(null);
                setIsAuthPanelOpen((current) => !current);
              }}
              className="font-styled rounded-lg border border-text-color/15 px-3 py-2 text-sm font-bold tracking-[0.2em] uppercase text-title-color transition hover:bg-text-color/10 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="button"
            >
              {isLoading ? "..." : "Log in"}
            </button>
            {isAuthPanelOpen ? (
              <div className="absolute right-32 top-14 z-20 w-80 rounded-2xl border border-text-color/10 bg-white/95 p-4 shadow-xl backdrop-blur-md">
                <form className="flex flex-col gap-3" onSubmit={(event) => void handleSignIn(event)}>
                  <div className="space-y-1">
                    <p className="font-styled text-sm font-bold uppercase tracking-[0.3em] text-title-color">
                      Login
                    </p>
                    <p className="text-sm text-text-color/80">
                      Use your Snap Tool email and password.
                    </p>
                  </div>
                  <label className="flex flex-col gap-1 text-sm text-title-color">
                    Email
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="rounded-xl border border-text-color/15 bg-white px-3 py-2 outline-none transition focus:border-accent"
                      placeholder="name@example.com"
                      type="email"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-title-color">
                    Password
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="rounded-xl border border-text-color/15 bg-white px-3 py-2 outline-none transition focus:border-accent"
                      placeholder="••••••••"
                      type="password"
                    />
                  </label>
                  {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsAuthPanelOpen(false);
                        setAuthError(null);
                      }}
                      className="rounded-lg px-3 py-2 text-sm text-text-color transition hover:bg-text-color/10"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="font-styled rounded-lg bg-accent px-3 py-2 text-sm font-bold uppercase tracking-[0.2em] text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? "Signing in" : "Log in"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
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
