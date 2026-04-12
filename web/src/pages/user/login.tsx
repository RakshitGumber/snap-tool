import { useEffect, useState, type FormEvent } from "react";

import { Navbar } from "@/Components/main/Navbar";
import { Link } from "@/pages/Link";
import { useRouter } from "@/pages/useRouter";
import { useAuthStore } from "@/stores/useAuthStore";

export const LoginRoute = () => {
  const { setRoute } = useRouter();
  const { isLoading, session, signIn } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setRoute("/create");
    }
  }, [session, setRoute]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const nextSession = await signIn({
      email: email.trim(),
      password,
      rememberMe,
    });

    if (!nextSession?.user) {
      setErrorMessage("Unable to sign in with that email and password.");
      return;
    }

    setRoute("/create");
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col">
      <Navbar />

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl gap-6 overflow-hidden rounded-[36px] border border-text-color/10 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.34),_transparent_34%),linear-gradient(145deg,rgba(17,24,39,0.98),rgba(30,41,59,0.9))] px-8 py-10 text-white">
            <p className="text-xs uppercase tracking-[0.38em] text-white/65">
              Email Login
            </p>
            <h1 className="mt-4 font-styled text-4xl font-bold uppercase tracking-[0.18em]">
              Jump Back Into Your Board
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/78">
              Sign in with your email to keep editing canvases, manage layouts,
              and share the latest snapshot from the create workspace.
            </p>
            <div className="mt-10 rounded-[28px] border border-white/12 bg-white/6 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">
                Access
              </p>
              <p className="mt-3 text-2xl font-semibold">Create studio</p>
              <p className="mt-2 text-sm text-white/72">
                Protected routes now send unauthenticated users here instead of
                dropping them on the landing page.
              </p>
            </div>
          </div>

          <div className="px-8 py-10">
            <p className="text-xs uppercase tracking-[0.3em] text-secondary-text">
              Welcome Back
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-title-color">
              Sign in with email
            </h2>
            <p className="mt-3 text-sm leading-7 text-secondary-text">
              Use the same email and password you registered with.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-secondary-text">
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-text-color/10 bg-white px-4 py-3 text-title-color outline-none transition focus:border-accent"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-secondary-text">
                  Password
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-text-color/10 bg-white px-4 py-3 text-title-color outline-none transition focus:border-accent"
                  placeholder="Enter your password"
                  required
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-text-color/10 bg-bg px-4 py-3 text-sm text-title-color">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                Keep this session signed in
              </label>

              {errorMessage ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-title-color px-4 py-3 text-sm font-bold uppercase tracking-[0.24em] text-bg transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-sm text-secondary-text">
              Need an account?{" "}
              <Link to="/auth/register" className="font-semibold text-title-color">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
