import { motion, type Variants } from "framer-motion";

const heroAnimationReveal: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.6,
      duration: 2,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export const HeroAnimation = () => {
  return (
    <motion.div
      variants={heroAnimationReveal}
      initial="hidden"
      animate="visible"
      className="relative flex w-full flex-1 items-center justify-center lg:items-end mb-8 lg:mb-12 py-8 md:py-12 lg:py-24"
    >
      <motion.div className="relative border-12 md:border-16 border-white border-b-56 md:border-b-72 lg:border-b-80 -rotate-6 shadow-[6px_6px_15px_#0008]">
        <motion.div
          initial={{ background: "white" }}
          animate={{
            background:
              "linear-gradient(180deg, rgba(4, 71, 54, 1) 0%, rgba(75, 173, 135, 1) 68%, rgba(104, 220, 152, 1) 100%)",
          }}
          className="w-72 h-72 md:w-80 md:h-80 lg:w-100 lg:h-100 z-1"
        ></motion.div>
        <motion.div className="">
          <img
            src="/images/ferret.png"
            className="absolute left-1/2 top-16 md:top-18 lg:top-20 -translate-x-1/2 drop-shadow-2xl drop-shadow-teal-200 z-2 w-48 md:w-56 lg:w-auto"
          />
        </motion.div>
        <motion.h1 className="text-white absolute top-0 p-4 text-3xl md:text-4xl lg:text-5xl font-heading drop-shadow-lg">
          Frankly Nice
        </motion.h1>
      </motion.div>
    </motion.div>
  );
};
