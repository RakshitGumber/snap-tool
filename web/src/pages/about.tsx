import { Footer } from "@/components/main/Footer";
import { Navbar } from "@/components/main/Navbar";
import { Link } from "@/pages/Router";
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

const valueCards = [
  {
    icon: "solar:bolt-bold-duotone",
    title: "Built for quick output",
    description:
      "Single Filter trims the canvas workflow down to the actions that matter when you need a post ready now.",
  },
  {
    icon: "solar:palette-round-bold-duotone",
    title: "Consistent visual direction",
    description:
      "Themes, backgrounds, and contrast-forward styling help designs feel polished without asking for design-heavy setup.",
  },
  {
    icon: "solar:slider-vertical-bold-duotone",
    title: "Simple controls, useful range",
    description:
      "The tool stays lightweight while still giving you enough control to shape the final result with confidence.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Start with a clean base",
    description:
      "Open the editor, pick a background direction, and establish the structure before details get in the way.",
  },
  {
    number: "02",
    title: "Add content without friction",
    description:
      "Drop in text and media, adjust composition quickly, and keep the focus on readability and balance.",
  },
  {
    number: "03",
    title: "Export and move on",
    description:
      "Finish the piece, save the image, and get back to publishing instead of spending hours in a heavy design suite.",
  },
];

const statCards = [
  { label: "Core idea", value: "Minimal editing" },
  { label: "Design language", value: "Calm, crisp, modern" },
  { label: "Best use", value: "Fast social visuals" },
];

export const About = () => {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-bg">
      <Navbar />

      <section className="relative flex w-full justify-center px-6 pt-32 pb-16 sm:px-8 lg:px-10">
        <div className="flex w-full max-w-7xl flex-col gap-10">
          <motion.div
            custom={0.1}
            initial="hidden"
            animate="visible"
            variants={sectionReveal}
            className="flex flex-col gap-6"
          >
            <div className="w-fit rounded-2xl border-2 border-accent bg-accent-light/70 px-4 py-1 text-md font-semibold text-title-color">
              About Single Filter
            </div>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end">
              <div className="flex flex-col gap-6">
                <h1 className="max-w-4xl font-sans text-4xl font-bold tracking-wider text-title-color sm:text-5xl md:text-6xl leading-snug">
                  A focused canvas for making clean visual posts without the
                  usual editor overhead.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-text-color sm:text-xl">
                  Single Filter is designed around speed, clarity, and
                  restraint. The product aims to keep creation lightweight so
                  you can move from idea to shareable graphic in a few decisive
                  steps.
                </p>
              </div>

              <div className="rounded-4xl border border-border-color bg-card-bg/90 p-6 shadow-sm backdrop-blur-xl">
                <p className="font-sans text-sm font-bold uppercase tracking-[0.28em] text-accent">
                  Why it exists
                </p>
                <p className="mt-4 text-lg leading-8 text-text-color">
                  Not every visual needs a complex design suite. This tool
                  covers the practical middle ground: faster than a full editor,
                  more intentional than a template-only app.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            custom={0.2}
            initial="hidden"
            animate="visible"
            variants={sectionReveal}
            className="grid gap-4 md:grid-cols-3"
          >
            {statCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[1.75rem] border border-border-color bg-card-bg/85 p-6 shadow-sm backdrop-blur-xl"
              >
                <p className="font-sans text-sm font-semibold uppercase tracking-[0.24em] text-secondary-text">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-bold text-title-color">
                  {card.value}
                </p>
              </article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative flex w-full justify-center px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <motion.article
            custom={0.15}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={sectionReveal}
            className="rounded-4xl border border-border-color bg-card-bg p-8 shadow-sm"
          >
            <p className="font-sans text-sm font-bold uppercase tracking-[0.28em] text-accent">
              The approach
            </p>
            <h2 className="mt-5 font-sans text-3xl font-bold tracking-wide text-title-color">
              Deliberately simple, not limited.
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-8 text-text-color">
              <p>
                The visual system behind Single Filter favors strong spacing,
                high legibility, and a restrained color story. That makes the
                editor approachable for fast work while keeping results clean.
              </p>
              <p>
                The goal is not to expose every possible control. The goal is to
                expose the controls that most directly improve the final image.
              </p>
            </div>
          </motion.article>

          <motion.div
            custom={0.25}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionReveal}
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {valueCards.map((card) => (
              <article
                key={card.title}
                className="rounded-4xl border border-border-color bg-card-bg/95 p-6 shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light/60 text-3xl text-accent">
                  <Icon icon={card.icon} />
                </div>
                <h3 className="mt-6 font-sans text-2xl font-bold text-title-color">
                  {card.title}
                </h3>
                <p className="mt-4 text-lg leading-8 text-text-color">
                  {card.description}
                </p>
              </article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative flex w-full justify-center px-6 py-10 sm:px-8 lg:px-10">
        <div className="w-full max-w-7xl">
          <motion.div
            custom={0.15}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={sectionReveal}
            className="mb-8 flex max-w-3xl flex-col gap-4"
          >
            <p className="font-sans text-sm font-bold uppercase tracking-[0.28em] text-accent">
              Workflow
            </p>
            <h2 className="font-sans text-3xl font-bold tracking-wide text-title-color sm:text-4xl">
              Three clear steps from idea to export.
            </h2>
            <p className="text-lg leading-8 text-text-color">
              The editor is most useful when it removes hesitation. This flow
              keeps the process short and readable.
            </p>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-3">
            {processSteps.map((step, index) => (
              <motion.article
                key={step.number}
                custom={0.12 + index * 0.08}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={sectionReveal}
                className="rounded-4xl border border-border-color bg-card-bg p-7 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-accent">
                    {step.number}
                  </span>
                  <span className="h-px flex-1 bg-border-color" />
                </div>
                <h3 className="mt-6 font-sans text-2xl font-bold text-title-color">
                  {step.title}
                </h3>
                <p className="mt-4 text-lg leading-8 text-text-color">
                  {step.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex w-full justify-center px-6 pt-10 pb-20 sm:px-8 lg:px-10">
        <motion.div
          custom={0.15}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={sectionReveal}
          className="w-full max-w-7xl rounded-[2.25rem] border border-accent/25 bg-card-bg p-8 shadow-sm sm:p-10 lg:p-12"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-sans text-sm font-bold uppercase tracking-[0.28em] text-accent">
                Start creating
              </p>
              <h2 className="mt-4 font-sans text-3xl font-bold tracking-wide text-title-color sm:text-4xl">
                Open the canvas and build the next post without overthinking the
                tooling.
              </h2>
              <p className="mt-4 text-lg leading-8 text-text-color">
                Single Filter works best when the idea is already there and the
                editor simply needs to help it land cleanly.
              </p>
            </div>

            <Link
              to="/create"
              className="inline-flex w-fit items-center gap-3 rounded-2xl bg-accent px-6 py-3 font-sans text-lg font-bold tracking-wide text-bg transition-transform duration-200 hover:-translate-y-0.5"
            >
              Open Editor
              <Icon icon="solar:arrow-right-up-linear" className="text-2xl" />
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};
