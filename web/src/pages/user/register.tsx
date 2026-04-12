import { useEffect, useState, type FormEvent } from "react";

import { Navbar } from "@/Components/main/Navbar";
import { Link } from "@/pages/Link";
import { useRouter } from "@/pages/useRouter";
import { useAuthStore } from "@/stores/useAuthStore";

export const RegisterRoute = () => {
  const { setRoute } = useRouter();
  const { isLoading, session, signUp } = useAuthStore();
  const [name, setName] = useState("");
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

    const nextSession = await signUp({
      name: name.trim(),
      email: email.trim(),
      password,
      rememberMe,
    });

    if (!nextSession?.user) {
      setErrorMessage("Unable to register with those details.");
      return;
    }

    setRoute("/create");
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col">
      <Navbar />

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl gap-6 overflow-hidden rounded-[36px] border border-text-color/10 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.28),_transparent_30%),linear-gradient(160deg,rgba(255,250,236,0.92),rgba(244,247,255,0.96))] px-8 py-10">
            <p className="text-xs uppercase tracking-[0.38em] text-secondary-text">
              Email Register
            </p>
            <h1 className="mt-4 font-styled text-4xl font-bold uppercase tracking-[0.18em] text-title-color">
              Start A New Account
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-secondary-text">
              Register with your name, email, and password to open the create
              workspace and keep your session available across reloads.
            </p>
            <div className="mt-10 rounded-[28px] border border-text-color/10 bg-white/72 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-secondary-text">
                Included
              </p>
              <p className="mt-3 text-2xl font-semibold text-title-color">
                Email and password auth
              </p>
              <p className="mt-2 text-sm text-secondary-text">
                This uses the existing Better Auth email flow already enabled on
                the server.
              </p>
            </div>
          </div>

          <div className="px-8 py-10">
            <p className="text-xs uppercase tracking-[0.3em] text-secondary-text">
              Create Account
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-title-color">
              Register with email
            </h2>
            <p className="mt-3 text-sm leading-7 text-secondary-text">
              Fill out the form below and you will be sent straight to the
              create route after a successful sign-up.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-secondary-text">
                  Name
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-text-color/10 bg-white px-4 py-3 text-title-color outline-none transition focus:border-accent"
                  placeholder="Your name"
                  required
                />
              </label>

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
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-text-color/10 bg-white px-4 py-3 text-title-color outline-none transition focus:border-accent"
                  placeholder="Choose a password"
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
                Keep me signed in on this device
              </label>

              {errorMessage ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-bold uppercase tracking-[0.24em] text-bg transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Creating Account..." : "Register"}
              </button>
            </form>

            <p className="mt-6 text-sm text-secondary-text">
              Already registered?{" "}
              <Link to="/auth/login" className="font-semibold text-title-color">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
