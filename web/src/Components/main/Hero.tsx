export const Hero = () => {
  return (
    <main className="h-170 max-w-7xl flex flex-col lg:gap-10 gap-4 items-center justify-center">
      <h1 className="lg:text-8xl text-6xl font-styled font-extrabold text-title-color  text-center capitalize leading-snug">
        Create your next post without over designing
      </h1>
      <span className="lg:text-3xl text-2xl text-center">
        You don't have to be a professional to design amazing posts.
      </span>
      <div className="flex gap-8 my-4">
        <button className="px-8 py-4 outline-none bg-accent text-bg text-xl font-semibold font-styled capitalize rounded-lg cursor-pointer">
          Get Started
        </button>
        <button className="px-8 py-4 outline-none text-secondary-text text-xl font-semibold font-styled rounded-lg cursor-pointer">
          Take a Shot
        </button>
      </div>
    </main>
  );
};
