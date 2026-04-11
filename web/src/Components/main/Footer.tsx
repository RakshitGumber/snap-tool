import { Icon } from "@iconify/react";

export const Footer = () => {
  return (
    <footer className="my-12">
      <section className="flex flex-col items-start">
        <div className="w-full flex items-center justify-between">
          <p className="text-lg font-semibold font-mono">
            Crafted with Caffine and Codex.
          </p>
          <div className="flex flex-col gap-8 pb-4 transition-colors duration-200 sm:flex-row sm:flex-nowrap sm:items-center">
            <div className="flex flex-row gap-4">
              <a href="https://github.com/RakshitGumber">
                <Icon
                  icon="simple-icons:github"
                  className="text-3xl fill-title-color transition-colors duration-200"
                />
              </a>
              <a href="https://x.com/Gumber_Rakshit">
                <Icon
                  icon="simple-icons:x"
                  className="text-3xl fill-title-color transition-colors duration-200"
                />
              </a>
              <a href="https://www.linkedin.com/in/gumber-rakshit">
                <Icon
                  icon="simple-icons:linkedin"
                  className="text-3xl fill-title-color transition-colors duration-200"
                />
              </a>
            </div>
          </div>
        </div>
        <p className="text-center text-sm font-medium text-secondary-text transition-colors duration-200">
          &copy; 2026 Rakshit Gumber. All rights reserved.
        </p>
      </section>
    </footer>
  );
};
