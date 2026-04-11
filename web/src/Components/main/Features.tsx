import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

const slides = [
  {
    id: 1,
    text: "Create Images with Simple Clicks",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    text: "You don't have to scream for 2 pixels off",
    image: null,
  },
  {
    id: 3,
    text: "Dowload and share for free",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80",
  },
];

export const Features = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const getSlidePosition = (index: number) => {
    const total = slides.length;
    let diff = index - currentIndex;

    // Adjust for infinite wrapping
    if (diff > Math.floor(total / 2)) diff -= total;
    else if (diff < -Math.floor(total / 2)) diff += total;

    if (diff === 0) return "active";
    if (diff === 1) return "next";
    if (diff === -1) return "prev";
    if (diff > 1) return "hiddenRight";
    if (diff < -1) return "hiddenLeft";
  };

  const slideVariants = {
    active: {
      x: "0%",
      scale: 1,
      opacity: 1,
      zIndex: 20,
    },
    next: {
      x: "50%",
      scale: 0.8,
      opacity: 0.5,
      zIndex: 10,
    },
    prev: {
      x: "-50%",
      scale: 0.8,
      opacity: 0.5,
      zIndex: 10,
    },
    hiddenRight: {
      x: "80%",
      scale: 0.6,
      opacity: 0,
      zIndex: 0,
    },
    hiddenLeft: {
      x: "-80%",
      scale: 0.6,
      opacity: 0,
      zIndex: 0,
    },
  };

  return (
    <div className="relative w-full h-175 flex items-center justify-center overflow-hidden bg-bg border-b-2 border-border-color">
      <div className="relative w-full max-w-5xl h-full max-h-150 flex items-center justify-center perspective-1000">
        <AnimatePresence initial={false}>
          {slides.map((slide, index) => {
            const position = getSlidePosition(index);

            return (
              <motion.div
                key={slide.id}
                initial={false}
                animate={position}
                variants={slideVariants}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                onClick={() => {
                  // Allow clicking on adjacent slides to navigate
                  if (position === "next") handleNext();
                  if (position === "prev") handlePrev();
                }}
                className={`absolute w-[85%] md:w-[75%] h-[80%] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 ${
                  position === "active" ? "cursor-default" : "cursor-pointer"
                }`}
              >
                {/* Condition: If image exists -> Text Left, Image Right | Else -> Centered Text */}
                {slide.image ? (
                  <div className="flex flex-col md:flex-row w-full h-full">
                    <div className="flex-1 flex items-center justify-start p-8 md:p-12">
                      <p className="text-2xl md:text-4xl font-bold text-gray-800 leading-snug text-left">
                        {slide.text}
                      </p>
                    </div>
                    <div className="flex-1 h-1/2 md:h-full p-4">
                      <img
                        src={slide.image}
                        alt="Slide content"
                        className="w-full h-full object-cover rounded-2xl shadow-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full h-full items-center justify-center p-8 md:p-16">
                    <p className="text-3xl md:text-5xl font-extrabold text-gray-800 text-center leading-tight">
                      {slide.text}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <button
        onClick={handlePrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/80 backdrop-blur-md text-gray-800 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
      >
        <Icon icon="solar:alt-arrow-left-line-duotone" className="w-8 h-8" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/80 backdrop-blur-md text-gray-800 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
      >
        <Icon icon="solar:alt-arrow-right-line-duotone" className="w-8 h-8" />
      </button>
    </div>
  );
};
