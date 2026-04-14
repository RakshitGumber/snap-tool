import { motion } from "framer-motion";

export const HeroAnimation = () => {
  return (
    <div className="relative flex flex-1 items-center justify-center">
      <motion.div className="relative border-16 border-white border-b-80 -rotate-6">
        <motion.div
          initial={{ background: "white" }}
          animate={{
            background:
              "linear-gradient(180deg, rgba(4, 71, 54, 1) 0%, rgba(75, 173, 135, 1) 68%, rgba(104, 220, 152, 1) 100%)",
          }}
          className="w-100 h-100 z-1"
        ></motion.div>
        <motion.div className="">
          <img
            src="/images/ferret.png"
            className="absolute top-20 drop-shadow-2xl drop-shadow-teal-200 z-2"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
