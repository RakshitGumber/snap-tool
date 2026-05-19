import { Icon } from "@iconify/react";

export const Footer = () => {
  return (
    <footer className="py-12 w-full px-7 bg-card-bg flex justify-center">
      <section className="max-w-7xl flex gap-2 flex-col items-start flex-1 px-4 ">
        <div className="w-full flex sm:items-center sm:justify-between flex-col-reverse sm:flex-row">
          <p className="text-lg font-bold tracking-normal font-sans text-title-color">
            Single Filter helps creators turn links into finished social graphics.
          </p>
          <div className="flex flex-col gap-8 pb-4 sm:flex-row sm:items-center text-title-color">
            <div className="flex flex-row gap-6">
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
