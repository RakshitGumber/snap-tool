import { Icon } from "@iconify/react";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-border-color bg-card-bg px-7 py-12 flex justify-center">
      <section className="flex max-w-6xl flex-1 flex-col items-start gap-3 px-4">
        <div className="flex w-full flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-base font-semibold leading-7 tracking-normal font-sans text-title-color">
            Single Filter helps creators turn links into finished social graphics.
          </p>
          <div className="flex flex-col gap-6 pb-1 sm:flex-row sm:items-center text-title-color">
            <div className="flex flex-row gap-5">
              <a
                href="https://github.com/RakshitGumber"
                className="rounded-lg p-2 transition hover:bg-text-color/8"
                aria-label="GitHub profile"
              >
                <Icon
                  icon="simple-icons:github"
                  className="text-3xl fill-title-color transition-colors duration-200"
                />
              </a>
              <a
                href="https://x.com/Gumber_Rakshit"
                className="rounded-lg p-2 transition hover:bg-text-color/8"
                aria-label="X profile"
              >
                <Icon
                  icon="simple-icons:x"
                  className="text-3xl fill-title-color transition-colors duration-200"
                />
              </a>
              <a
                href="https://www.linkedin.com/in/gumber-rakshit"
                className="rounded-lg p-2 transition hover:bg-text-color/8"
                aria-label="LinkedIn profile"
              >
                <Icon
                  icon="simple-icons:linkedin"
                  className="text-3xl fill-title-color transition-colors duration-200"
                />
              </a>
            </div>
          </div>
        </div>
        <p className="text-sm font-semibold text-secondary-text transition-colors duration-200">
          &copy; 2026 Rakshit Gumber. All rights reserved.
        </p>
      </section>
    </footer>
  );
};
