import { Icon } from "@iconify/react";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-20 w-full bg-bg/95 backdrop-blur-2xl">
      <nav className="fixed inset-x-0 top-0 mx-auto flex h-auto max-w-7xl flex-col gap-10 bg-bg px-4 py-6 text-xl transition-colors duration-200 sm:relative sm:flex-row sm:items-center sm:justify-end sm:gap-12 sm:border-none sm:px-6">
        <div className="mt-20 flex flex-col items-start gap-5 font-content text-lg font-semibold sm:mt-0 sm:flex-row sm:items-center sm:justify-end sm:gap-8"></div>
        <div className="flex items-center justify-between gap-5 sm:justify-end">
          <a
            href="https://github.com/RakshitGumber"
            aria-label="Rakshit Gumber GitHub Profile"
          >
            <Icon
              icon="simple-icons:github"
              className="text-2xl transition-colors duration-200"
            />
          </a>
          <button />
        </div>
      </nav>
    </header>
  );
};
