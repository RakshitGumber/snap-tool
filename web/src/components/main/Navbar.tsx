import { Link } from "@/pages/Router";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

import { useState } from "react";
// import { useRouter } from "@/stores/useRouter";

const parentVariants = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: "-4rem" },
};

export const Navbar = () => {
  const { scrollY } = useScroll();
  // const route = useRouter((state) => state.route);
  const [hidden, setHidden] = useState(false);
  const [prevScroll, setPrevScroll] = useState(0);

  function update(latest: number, prev: number): void {
    if (latest < prev) {
      setHidden(false);
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
      className="fixed top-0 z-20 flex w-full justify-center border-b border-border-color bg-top-panel/90 backdrop-blur-xl"
      variants={parentVariants}
      animate={hidden ? "hidden" : "visible"}
      transition={{
        ease: [0.1, 0.25, 0.3, 1],
        duration: 0.6,
        staggerChildren: 0.05,
      }}
    >
      <nav className="relative flex max-w-6xl flex-1 items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 md:gap-3 mr-auto">
          <Link
            className="flex px-3 py-2 rounded-lg items-center cursor-pointer text-title-color hover:bg-secondary-text/20"
            to="/"
          >
            <h1 className="font-sans font-bold px-1 text-xl text-current tracking-normal md:px-2 md:text-2xl select-none">
              Single Filter
            </h1>
          </Link>
        </div>
        <div className="hidden items-center gap-1 md:flex">
          <a
            href="#examples"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-title-color transition hover:bg-text-color/8"
          >
            Examples
          </a>
          <a
            href="#workflow"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-title-color transition hover:bg-text-color/8"
          >
            Workflow
          </a>
          <a
            href="#faq"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-title-color transition hover:bg-text-color/8"
          >
            FAQ
          </a>
        </div>
        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          {/* <div className="hidden md:flex gap-2">
            <ThemeButton />
          </div> */}
          <Link
            to="/create"
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold tracking-normal text-bg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.5395 3C14.6303 3 13.7583 3.3599 13.1154 4.00052L9.07222 8.02925C7.21527 9.87957 5.89791 12.198 5.26098 14.7366L5.06561 15.5153C4.86299 16.3229 5.59714 17.0544 6.40764 16.8525L7.1891 16.6578C9.73681 16.0232 12.0635 14.7105 13.9205 12.8602L17.9636 8.83146C18.6066 8.19084 18.9678 7.32196 18.9678 6.41599C18.9678 4.52939 17.4329 3 15.5395 3ZM14.3776 7.57378C14.9965 8.19047 15.714 8.45317 16.2462 8.36088L16.8688 7.74049C17.2213 7.38921 17.4194 6.91278 17.4194 6.41599C17.4194 5.38149 16.5777 4.54286 15.5395 4.54286C15.041 4.54286 14.5628 4.7402 14.2103 5.09149L13.5877 5.71187C13.495 6.24217 13.7587 6.95709 14.3776 7.57378Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 20.2286C4 19.8025 4.34662 19.4571 4.77419 19.4571H19.2258C19.6534 19.4571 20 19.8025 20 20.2286C20 20.6546 19.6534 21 19.2258 21H4.77419C4.34662 21 4 20.6546 4 20.2286Z"
                fill="currentColor"
              />
            </svg>
            Create
          </Link>
        </div>
      </nav>
    </motion.header>
  );
};
