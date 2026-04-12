import { useEffect, useState } from "react";

import { Navbar } from "@/Components/main/Navbar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link } from "../Router";

export const RegisterRoute = () => {
  const { session, isLoading, signIn, signOut, refreshSession } =
    useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    refreshSession();
  }, []);

  const handleSignIn = async () => {
    await signIn({ email, password });
  };

  return (
    <main className="h-screen">
      <Navbar />
      <div className="px-7 items-start justify-center h-[calc(100vh-100px)] flex flex-col gap-10 w-2/3 mx-auto">
        <h1 className="font-styled text-4xl font-bold uppercase tracking-[0.18em] text-title-color">
          Get Started
        </h1>
        <form className="flex flex-col justify-between gap-4 w-full">
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-secondary-text">
              Username
            </span>
            <input
              type="text"
              autoComplete="name"
              className="w-full rounded-2xl border border-text-color/10 bg-white px-4 py-3 text-title-color outline-none transition focus:border-accent"
              placeholder="Your name"
              required
            />
          </div>

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
            <input type="checkbox" className="h-4 w-4 accent-accent" />
            Keep me signed in on this device
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-bold uppercase tracking-[0.24em] text-bg transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <span className="mt-6 text-sm text-secondary-text">
          Already registered?{" "}
          <Link to="/auth/login" className="font-semibold text-title-color">
            Sign in here
          </Link>
        </span>
      </div>
    </main>
  );
};
