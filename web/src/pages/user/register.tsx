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
      <div className="px-7 items-start justify-center h-[calc(100vh-100px)] flex flex-col gap-6 w-2/3 mx-auto">
        <h1 className="font-styled text-4xl font-bold uppercase tracking-wide text-title-color">
          Get Started
        </h1>
        <form className="flex flex-col justify-between gap-5 w-full">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold uppercase tracking-widest text-secondary-text">
              Username
            </span>
            <input
              type="text"
              className="w-full rounded-sm border-b-2 border-accent bg-card-bg px-4 py-2 text-title-color outline-none transition focus:border-accent"
              placeholder="Eg: GumberRakshit"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-widest text-secondary-text">
              Email
            </span>
            <input
              type="email"
              className="w-full rounded-sm border-b-2 border-accent bg-card-bg px-4 py-2 text-title-color outline-none transition focus:border-accent"
              placeholder="Eg: gumberrakshit@yomail.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-widest text-secondary-text">
              Password
            </span>
            <input
              type="password"
              className="w-full rounded-sm border-b-2 border-accent bg-card-bg px-4 py-2 text-title-color outline-none transition focus:border-accent"
              placeholder="Eg: ********"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-sm bg-accent px-4 py-3 text-sm font-bold uppercase text-bg cursor-pointer"
          >
            Create
          </button>
        </form>

        <span className="mt-4">
          Already a User?{" "}
          <Link
            to="/auth/login"
            className="pl-1 font-semibold text-title-color"
          >
            Sign in here
          </Link>
        </span>
      </div>
    </main>
  );
};
