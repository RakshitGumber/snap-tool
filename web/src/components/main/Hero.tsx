import { Link } from "@/pages/Router";
import { Icon } from "@iconify/react";
import { motion, type Variants } from "framer-motion";
import { HeroAnimation } from "@/components/ui/HeroAnimation";

const heroContentReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3,
      duration: 1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export const Hero = () => {
  return (
    <main className="min-h-screen max-w-7xl w-full flex flex-col lg:flex-row items-center py-12 lg:py-0">
      <motion.div
        variants={heroContentReveal}
        initial="hidden"
        animate="visible"
        className="flex flex-col flex-1 justify-center lg:justify-end items-center lg:items-start gap-8 lg:gap-16 px-7 py-20 sm:text-center text-left lg:text-left"
      >
        <div className="px-4 py-1 border-2 border-accent w-fit rounded-2xl bg-accent-light/80 text-title-color text-md font-semibold mx-auto lg:mx-0">
          Releasing new templates everyday.
        </div>
        <div className="flex flex-col gap-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans tracking-wider font-bold text-title-color capitalize leading-snug">
            Minimalist solution to creating your next post
          </h1>
          <span className="text-lg lg:text-2xl text px-1 w-full md:w-4/5 lg:w-3/4 mx-auto lg:mx-0">
            Make professional grade posts in simple click. Making post wasn't
            this easy.
          </span>
          <div className="flex flex-wrap justify-start sm:justify-center lg:justify-start items-center lg:items-start gap-4 my-4 px-1 font-sans">
            <Link to="/create">
              <button className="lg:px-6 lg:py-3 px-3 py-2 bg-accent text-bg sm:text-xl font-bold capitalize rounded-lg cursor-pointer">
                Create Now
              </button>
            </Link>
            <Link to="/about">
              <button className="lg:px-6 lg:py-3 px-3 py-2 sm:text-xl font-semibold rounded-lg cursor-pointer capitalize flex gap-2 items-center hover:text-title-color">
                learn more{" "}
                <Icon
                  icon="ooui:link-external-ltr"
                  className="text-accent mb-1"
                />
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
      <div className="hidden md:block">
        <HeroAnimation />
      </div>
    </main>
  );
};
