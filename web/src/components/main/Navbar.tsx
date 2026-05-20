import { Link } from "@/pages/Router";
import { Icon } from "@iconify/react";
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
      <nav className="relative flex flex-1 items-center justify-between gap-3 py-3 px-4">
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
        {/* <div className="hidden items-center gap-1 md:flex">
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
        </div> */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          {/* <div className="hidden md:flex gap-2">
            <ThemeButton />
          </div> */}
          <Link
            to="/create"
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-2 text-base font-bold tracking-normal text-bg transition hover:opacity-90 "
          >
            <Icon icon="mingcute:edit-3-line" fontSize={22} className="mb-1" />
            Create
          </Link>
        </div>
      </nav>
    </motion.header>
  );
};
