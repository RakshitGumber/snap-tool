import { Link } from "@/pages/Router";
import { Icon } from "@iconify/react";
import { HeroAnimation } from "../ui/HeroAnimation";

export const Hero = () => {
  return (
    <main className="min-h-screen max-w-7xl w-full flex flex-col lg:flex-row items-center lg:items-stretch py-12 lg:py-0">
      <div className="flex flex-col flex-1 justify-center lg:justify-end items-center lg:items-start gap-8 lg:gap-12 px-7 py-20 lg:py-24 sm:text-center text-left lg:text-left">
        <div className="px-4 py-1 border-2 border-accent w-fit rounded-2xl bg-accent-light/80 text-title-color text-md font-semibold mx-auto lg:mx-0">
          Releasing a new version everyday.
        </div>
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-comic tracking-wider font-semibold text-title-color capitalize leading-snug">
            Minimalist solution for creating your next post
          </h1>
          <span className="text-lg lg:text-2xl text px-1 w-full md:w-4/5 lg:w-3/4 mx-auto lg:mx-0">
            Make professional grade posts in simple click. Making post wasn't
            this easy.
          </span>
          <div className="flex flex-wrap justify-start sm:justify-center items-center lg:items-start gap-4 my-4 px-1">
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
      </div>
      <HeroAnimation />
    </main>
  );
};
