// Deprecated
import { Icon } from "@iconify/react";
import { motion, type Variants } from "framer-motion";

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const featureCards = [
  {
    icon: "solar:sidebar-code-bold-duotone",
    title: "Four-button editor rail",
    description:
      "The canvas is organized around four direct controls: Overview, Background, Text, and Images. That keeps the workflow readable and makes it easy to jump straight to the part of the post you want to change.",
    points: [
      "Overview keeps the full composition in view",
      "Background handles presets and visual direction",
      "Text gives the writing layer its own focused space",
      "Images manages uploads and asset placement",
    ],
  },
  {
    icon: "solar:link-square-bold-duotone",
    title: "Link-to-card imports",
    description:
      "Paste a YouTube link, GitHub repository URL, or direct image URL and the app turns it into a usable visual asset for the canvas. It is a fast way to pull external content into a polished post layout.",
    points: [
      "YouTube links resolve into video thumbnail visuals",
      "GitHub links resolve into repository preview cards",
      "Direct image URLs can be imported without local download steps",
      "Imported assets are stored in the in-app library for reuse",
    ],
  },
];

export const Features = () => {
  return (
    <section className="relative flex w-full justify-center px-6 py-10 sm:px-8 lg:px-10">
      <div className="w-full max-w-7xl">
        <motion.div
          custom={0.16}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={sectionReveal}
          className="mb-8 flex max-w-3xl flex-col gap-4"
        >
          <p className="font-sans text-sm font-bold uppercase tracking-[0.28em] text-accent">
            Features
          </p>
          <h2 className="font-sans text-3xl font-bold tracking-wide text-title-color sm:text-4xl">
            Two features that define how the app stays fast.
          </h2>
          <p className="text-lg leading-8 text-text-color">
            The editor is structured around a small number of decisive actions.
            These two features carry most of that speed in day-to-day use.
          </p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          {featureCards.map((feature, index) => (
            <motion.article
              key={feature.title}
              custom={0.14 + index * 0.1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={sectionReveal}
              className="rounded-4xl border border-border-color bg-card-bg p-7 shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light/60 text-3xl text-accent">
                <Icon icon={feature.icon} />
              </div>
              <h3 className="mt-6 font-sans text-2xl font-bold text-title-color">
                {feature.title}
              </h3>
              <p className="mt-4 text-lg leading-8 text-text-color">
                {feature.description}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                {feature.points.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-border-color bg-bg/70 px-4 py-4"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                    <p className="text-base leading-7 text-text-color sm:text-lg">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
