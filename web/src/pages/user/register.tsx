import { useState } from "react";

import { Link, useRouter } from "../Router";
import { useAuthStore } from "@/stores/useAuthStore";
import { Navbar } from "@/Components/main/Navbar";

export const RegisterRoute = () => {
  const { signUp } = useAuthStore();
  const setRoute = useRouter((state) => state.setRoute);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async (event: React.SubmitEvent) => {
    event.preventDefault();
    setErrorMessage("");

    const result = await signUp({
      name,
      email,
      password,
    });

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setRoute("/create");
  };

  return (
    <main className="h-screen">
      <Navbar />
      <div className="px-7 items-start justify-center h-[calc(100vh-100px)] flex flex-col gap-6 w-2/3 mx-auto">
        <h1 className="font-styled text-4xl font-bold uppercase tracking-wide text-title-color">
          Get Started
        </h1>
        <form
          className="flex w-full flex-col justify-between gap-5"
          onSubmit={handleRegister}
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold uppercase tracking-widest text-secondary-text">
              Username
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-sm border-b-2 border-accent bg-card-bg px-4 py-2 text-title-color outline-none transition focus:border-accent"
              placeholder="Eg: ********"
              minLength={8}
              required
            />
          </div>

          {errorMessage ? (
            <p className="text-sm font-medium text-red-500">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            className="mt-6 w-full cursor-pointer rounded-sm bg-accent px-4 py-3 text-sm font-bold uppercase text-bg transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            Create
          </button>
        </form>
        <span className="text-secondary-text text-medium">
          Already a user?{" "}
          <Link
            className="pl-1 text-title-color font-semibold"
            to="/auth/login"
          >
            Click here
          </Link>
        </span>
      </div>
    </main>
  );
};
