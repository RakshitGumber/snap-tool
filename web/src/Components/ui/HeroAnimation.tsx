import { useEffect, useState } from "react";
import { motion, type Variants, useAnimationControls } from "framer-motion";

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

const PANEL_SIZE = "w-72 h-72 md:w-80 md:h-80 lg:w-100 lg:h-100";
const HERO_TITLE = "Frankly Easy";
const IMAGE_START_OFFSET = 320;
const TYPING_STEP_MS = 100;

export const HeroAnimation = () => {
  const cardControls = useAnimationControls();
  const backgroundControls = useAnimationControls();
  const imageControls = useAnimationControls();
  const [typedTitle, setTypedTitle] = useState("");

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let cancelled = false;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          timers.delete(timeoutId);
          resolve();
        }, ms);

        timers.add(timeoutId);
      });

    const runSequence = async () => {
      setTypedTitle("");

      await backgroundControls.start({
        clipPath: "circle(160% at 0% 0%)",
        transition: {
          delay: 2,
          duration: 2,
          ease: [0.22, 1, 0.36, 1] as const,
        },
      });

      await imageControls.start({
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 60,
          damping: 10,
          mass: 0.3,
        },
      });

      for (let index = 1; index <= HERO_TITLE.length; index += 1) {
        setTypedTitle(HERO_TITLE.slice(0, index));
        await wait(TYPING_STEP_MS);
      }
    };

    void runSequence();

    return () => {
      cancelled = true;

      for (const timeoutId of timers) {
        clearTimeout(timeoutId);
      }
    };
  }, [backgroundControls, cardControls, imageControls]);

  return (
    <motion.div
      variants={heroAnimationReveal}
      initial="hidden"
      animate="visible"
      className="relative flex w-full flex-1 items-center justify-center lg:items-end mb-8 lg:mb-12 py-8 md:py-12 lg:py-24"
    >
      <motion.div
        animate={cardControls}
        className="relative border-12 md:border-16 border-white border-b-56 md:border-b-72 lg:border-b-80 -rotate-6 shadow-[6px_6px_15px_#0008]"
      >
        <div className={`relative overflow-hidden bg-white ${PANEL_SIZE}`}>
          <motion.div
            initial={{ clipPath: "circle(0% at 0% 0%)" }}
            animate={backgroundControls}
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(4, 71, 54, 1) 0%, rgba(75, 173, 135, 1) 68%, rgba(104, 220, 152, 1) 100%)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 top-16 md:top-18 lg:top-20 flex justify-center">
              <motion.div
                initial={{
                  y: IMAGE_START_OFFSET,
                }}
                animate={imageControls}
                className="origin-bottom"
              >
                <img
                  src="/images/ferret.png"
                  className="drop-shadow-2xl drop-shadow-teal-200 w-48 md:w-56 lg:w-auto"
                />
              </motion.div>
            </div>
          </div>
        </div>
        <motion.h1 className="text-white absolute top-0 p-4 text-3xl md:text-4xl lg:text-5xl font-heading drop-shadow-lg">
          {typedTitle}
        </motion.h1>
      </motion.div>
    </motion.div>
  );
};
