import { Link } from "@/pages/Router";
import { Icon } from "@iconify/react";

export const Hero = () => {
  return (
    <main className="h-screen max-w-7xl w-full flex items-stretch">
      <div className="flex flex-col flex-1 justify-end gap-12 px-7 py-24">
        <div className="px-4 py-1 border-2 border-accent w-fit rounded-2xl bg-accent-light/80 text-title-color text-md font-semibold">
          Releasing a new version everyday.
        </div>
        <div className="flex flex-col gap-6">
          <h1 className="text-6xl font-comic tracking-wider font-semibold text-title-color capitalize leading-snug">
            Minimalist solution for creating your next post
          </h1>
          <span className="text-2xl text px-1 w-3/4">
            Make professional grade posts in simple click. Making post wasn't
            this easy.
          </span>
          <div className="flex items-start gap-4 my-4 px-1">
            <Link to="/create">
              <button className="px-6 py-3 bg-accent text-bg text-xl font-bold capitalize rounded-lg cursor-pointer">
                Create Now
              </button>
            </Link>
            <Link to="/about">
              <button className="px-6 py-3 text-xl font-semibold rounded-lg cursor-pointer capitalize flex gap-2 items-center hover:text-title-color">
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
      <div className="relative flex flex-col flex-1 items-center justify-end py-24">
        <div className="mb-12 bg-white h-100 w-100 shadow-lg shadow-accent-light border-2 border-accent/80"></div>
      </div>
    </main>
  );
};
