import { Link } from "@/pages/Router";
import { Icon } from "@iconify/react";

export const Hero = () => {
  return (
    <main className="h-screen max-w-7xl w-full flex items-stretch">
      <div className="flex flex-col flex-1 justify-center px-7 py-24">
        <div className="flex flex-col gap-8">
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
                  className="text-accent-light mb-1"
                />
              </button>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1">Hello</div>
    </main>
  );
};
