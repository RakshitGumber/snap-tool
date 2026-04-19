import { Link } from "@/pages/Router";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

import { Icon } from "@iconify/react";

import { ThemeButton } from "@/components/ui/ThemeButton";
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
            className="flex lg:hidden rounded-lg p-2 text-title-color transition hover:bg-text-color/20"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className=""
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.25 12C3.25 11.5858 3.58579 11.25 4 11.25L19.9996 11.25C20.4138 11.25 20.7496 11.5858 20.7496 12C20.7496 12.4142 20.4138 12.75 19.9996 12.75H4C3.58579 12.75 3.25 12.4142 3.25 12ZM6.53307 19C6.53307 18.5858 6.86886 18.25 7.28307 18.25L20 18.25C20.4142 18.25 20.75 18.5858 20.75 19C20.75 19.4142 20.4142 19.75 20 19.75L7.28307 19.75C6.86886 19.75 6.53307 19.4142 6.53307 19ZM12.2219 5C12.2219 4.58579 12.5577 4.25 12.9719 4.25L20 4.25C20.4142 4.25 20.75 4.58579 20.75 5C20.75 5.41421 20.4142 5.75 20 5.75L12.9719 5.75C12.5577 5.75 12.2219 5.41421 12.2219 5Z"
                fill="var(--text-heading)"
              />
            </svg>
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
            className="font-sans px-3 py-2 rounded-lg gap-1 flex items-center justify-center font-bold tracking-wider text-title-color cursor-pointer hover:bg-text-color/20"
            onClick={() => setMenuOpen(false)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.5395 3C14.6303 3 13.7583 3.3599 13.1154 4.00052L9.07222 8.02925C7.21527 9.87957 5.89791 12.198 5.26098 14.7366L5.06561 15.5153C4.86299 16.3229 5.59714 17.0544 6.40764 16.8525L7.1891 16.6578C9.73681 16.0232 12.0635 14.7105 13.9205 12.8602L17.9636 8.83146C18.6066 8.19084 18.9678 7.32196 18.9678 6.41599C18.9678 4.52939 17.4329 3 15.5395 3ZM14.3776 7.57378C14.9965 8.19047 15.714 8.45317 16.2462 8.36088L16.8688 7.74049C17.2213 7.38921 17.4194 6.91278 17.4194 6.41599C17.4194 5.38149 16.5777 4.54286 15.5395 4.54286C15.041 4.54286 14.5628 4.7402 14.2103 5.09149L13.5877 5.71187C13.495 6.24217 13.7587 6.95709 14.3776 7.57378Z"
                fill="var(--accent-color)"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 20.2286C4 19.8025 4.34662 19.4571 4.77419 19.4571H19.2258C19.6534 19.4571 20 19.8025 20 20.2286C20 20.6546 19.6534 21 19.2258 21H4.77419C4.34662 21 4 20.6546 4 20.2286Z"
                fill="var(--accent-color)"
              />
            </svg>
            Create
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
              <div className="mt-3 flex items-center gap-2 border-t border-accent/30 p-2 md:hidden">
                <a
                  href="https://github.com/RakshitGumber/snap-tool"
                  className="rounded-lg font-semibold hover:bg-title-color/20 items-center flex gap-1 text-xl p-2 text-title-color"
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
