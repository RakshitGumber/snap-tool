import { Link } from "@/pages/Router";
import { useAuthStore } from "@/stores/useAuthStore";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

import { Icon } from "@iconify/react";

import { ThemeButton } from "../ui/ThemeButton";
import { useEffect, useState } from "react";

const parentVariants = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: "-4rem" },
};

export const Navbar = () => {
  const { session, signOut } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [prevScroll, setPrevScroll] = useState(0);

  function update(latest: number, prev: number): void {
    if (latest < prev) {
      setHidden(false);
      // console.log("visible");
    } else if (latest > 100 && latest > prev) {
      setHidden(true);
      // console.log("hidden");
    }
  }

  useMotionValueEvent(scrollY, "change", (latest: number) => {
    update(latest, prevScroll);
    setPrevScroll(latest);
  });

  useEffect(() => {
    window.addEventListener("scroll", () => setShowProfile(false));

    removeEventListener("scroll", () => setShowProfile(false));
  }, [showProfile]);

  return (
    <motion.header
      className="h-18 bg-card-bg/95 backdrop-blur-3xl border-b-2 border-accent dark:border-accent/70 w-full fixed top-0 z-20 flex justify-center shadow-md light:shadow-title-color/30"
      variants={parentVariants}
      animate={hidden ? "hidden" : "visible"}
      transition={{
        ease: [0.1, 0.25, 0.3, 1],
        duration: 0.6,
        staggerChildren: 0.05,
      }}
    >
      <nav className="max-w-7xl flex items-center justify-between p-6 flex-1">
        <Link className="rounded-lg flex items-center cursor-pointer" to="/">
          <h1 className="font-heading text-2xl text-title-color hover:text-accent tracking-wider capitalize select-none">
            Single Filter
          </h1>
        </Link>
        <ul className="flex gap-1">
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
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <a
              href="https://github.com/RakshitGumber/snap-tool"
              className="rounded-lg font-semibold hover:bg-accent-light items-center flex gap-1 text-xl p-2 text-title-color"
              target="_blank"
            >
              <Icon icon="simple-icons:github" />
            </a>
            <ThemeButton />
          </div>
          {session?.user ? (
            <>
              <button
                className="rounded-full cursor-pointer"
                onClick={() => setShowProfile(true)}
              >
                <img
                  src={
                    session.user.image ??
                    `https://ui-avatars.com/api/?name=${session.user.name}&background=37af87&font-size=0.4&bold=true&color=fff`
                  }
                  className="rounded-full w-8"
                />
              </button>
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
            </>
          ) : (
            <Link
              to="/auth/register"
              className="font-styled px-3 py-2 rounded-lg gap-2 flex items-center justify-center font-semibold text-bg tracking-wide bg-accent cursor-pointer"
            >
              Register
              <Icon icon="solar:add-square-broken" className="text-xl" />
            </Link>
          )}
          {showProfile && (
            <div className="absolute top-18 rounded-b-lg border-b-2 border-accent right-30 w-50 bg-card-bg p-4">
              <button
                className="w-full bg-accent py-1 text-lg rounded-lg text-bg font-semibold"
                onClick={signOut}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </nav>
    </motion.header>
  );
};
