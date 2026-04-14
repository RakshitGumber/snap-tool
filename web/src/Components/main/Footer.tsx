import { Icon } from "@iconify/react";

export const Footer = () => {
  return (
    <footer className="py-12 w-full px-7 bg-card-bg flex justify-center border-t-2 border-accent/80">
      <section className="mb-24 max-w-7xl flex flex-col items-start flex-1">
        <div className="w-full flex items-center justify-between">
          <p className="text-lg font-semibold font-heading text-title-color tracking-widest">
            Crafted with Caffine and Serotonin.
          </p>
          <div className="flex flex-col gap-8 pb-4 transition-colors duration-200 sm:flex-row sm:flex-nowrap sm:items-center">
            <div className="flex flex-row gap-4">
              <a href="https://gumberrakshit.com">
                <Icon
                  icon="solar:accessibility-broken"
                  className="text-3xl fill-title-color transition-colors duration-200"
                />
              </a>
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
        <p className="text-center text-md font-medium transition-colors duration-200">
          &copy; 2026 Rakshit Gumber. All rights reserved.
        </p>
      </section>
    </footer>
  );
};
