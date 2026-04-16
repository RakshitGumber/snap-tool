import { Link } from "@/pages/Router";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

import { Icon } from "@iconify/react";

import { ThemeButton } from "../ui/ThemeButton";
import { useState } from "react";

const parentVariants = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: "-4rem" },
};

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Contribute", to: "/contribute" },
];

export const Navbar = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [prevScroll, setPrevScroll] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  function update(latest: number, prev: number): void {
    if (latest < prev) {
      setHidden(false);
      setMenuOpen(false);
    } else if (latest > 100 && latest > prev) {
      setHidden(true);
    }
  }

  useMotionValueEvent(scrollY, "change", (latest: number) => {
    update(latest, prevScroll);
    setPrevScroll(latest);
  });

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
      <nav className="relative max-w-7xl flex items-center justify-between p-4 md:p-6 flex-1 gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            className="flex lg:hidden rounded-lg p-2 text-title-color transition hover:bg-accent-light"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon
              icon={
                menuOpen
                  ? "solar:close-circle-broken"
                  : "solar:hamburger-menu-broken"
              }
              className="text-2xl"
            />
          </button>
          <Link
            className="hidden md:flex rounded-lg items-center cursor-pointer"
            to="/"
            onClick={() => setMenuOpen(false)}
          >
            <h1 className="font-heading text-2xl text-title-color hover:text-accent tracking-wider capitalize select-none">
              Single Filter
            </h1>
          </Link>
        </div>
        <ul className="hidden lg:flex gap-1 flex-1 px-8">
          {navItems.map((item) => (
            <li
              key={item.to}
              className="flex px-4 py-2 hover:bg-text-color/20 cursor-pointer rounded-lg"
            >
              <Link to={item.to}>{item.label}</Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex gap-2">
            <a
              href="https://github.com/RakshitGumber/snap-tool"
              className="rounded-lg font-semibold hover:bg-accent-light items-center flex gap-1 text-xl p-2 text-title-color"
              target="_blank"
              rel="noreferrer"
            >
              <Icon icon="simple-icons:github" />
            </a>
            <ThemeButton />
          </div>
          <Link
            to="/create"
            className="font-styled px-3 py-2 rounded-lg gap-2 flex items-center justify-center font-semibold text-bg tracking-wide bg-accent cursor-pointer"
            onClick={() => setMenuOpen(false)}
          >
            Create
            <Icon icon="solar:add-square-broken" className="text-xl" />
          </Link>
        </div>

        {menuOpen ? (
          <div className="absolute top-full left-0 right-0 lg:hidden">
            <div className="rounded-b-2xl border-b-2 border-accent/80 bg-card-bg p-3 shadow-lg">
              <ul className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="flex rounded-lg px-4 py-3 text-title-color transition hover:bg-text-color/20"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center gap-2 border-t border-accent/30 pt-3 md:hidden">
                <a
                  href="https://github.com/RakshitGumber/snap-tool"
                  className="rounded-lg font-semibold hover:bg-accent-light items-center flex gap-1 text-xl p-2 text-title-color"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon icon="simple-icons:github" />
                </a>
                <div onClick={() => setMenuOpen(false)}>
                  <ThemeButton />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </motion.header>
  );
};
