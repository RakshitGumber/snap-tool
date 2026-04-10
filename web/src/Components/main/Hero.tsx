export const Hero = () => {
  return (
    <main className="h-150 max-w-7xl flex flex-col gap-8 items-center justify-center">
      <h1 className="text-8xl font-styled font-extrabold text-title-color  text-center capitalize leading-snug">
        Create your next post without over doing
      </h1>
      <span className="text-3xl text-center">
        You don't have to be a professional to design amazing posts.
      </span>
      <div className="flex gap-8">
        <button className="px-6 py-3 outline-none bg-accent text-bg font-semibold font-styled capitalize rounded-lg cursor-pointer">
          Get Started
        </button>
        <button className="px-6 py-3 outline-none text-secondary-text font-semibold font-styled rounded-lg cursor-pointer">
          Take a Shot
        </button>
      </div>
    </main>
  );
};
