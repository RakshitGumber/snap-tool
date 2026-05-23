import { Link } from "@/pages/Router";
import { Icon } from "@iconify/react";
import { motion, type Variants, useReducedMotion } from "framer-motion";

const reveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const WORKFLOW: Array<{
  step: string;
  title: string;
  copy: string;
  icon: string;
}> = [
  {
    step: "01",
    title: "Paste a link",
    copy: "YouTube, GitHub, or a website URL. We pull the useful context and build a credible first layout.",
    icon: "lucide:link-2",
  },
  {
    step: "02",
    title: "Pick a frame",
    copy: "Choose a size, a template treatment, and a background. Controls stay tight so you keep momentum.",
    icon: "lucide:layout-template",
  },
  {
    step: "03",
    title: "Export PNG",
    copy: "Compare variants, make small edits, export a post-ready graphic you would actually ship.",
    icon: "lucide:download",
  },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Is this a full design suite?",
    a: "No. Single Filter is intentionally smaller: paste a link, choose a strong default, make light edits, export.",
  },
  {
    q: "What kinds of posts is it for?",
    a: "Launch announcements, repo highlights, YouTube promotion, website shares, changelog images, and quick creator updates.",
  },
  {
    q: "Why not just screenshot the page?",
    a: "Screenshots are inconsistent. Single Filter turns the same source link into a clean, platform-sized graphic every time.",
  },
];

export const Hero = () => {
  const reduceMotion = useReducedMotion();

  const motionProps = reduceMotion
    ? { initial: false, animate: "visible" as const }
    : { initial: "hidden" as const, animate: "visible" as const };

  return (
    <div className="w-full overflow-hidden">
      <section className="relative flex min-h-[90svh] w-full items-center justify-center px-6 pb-12 pt-24 sm:px-8 lg:pt-28">
        <div className="absolute inset-0 -z-10 bg-bg" />

        <motion.div
          variants={stagger}
          {...motionProps}
          className="flex w-full max-w-6xl flex-col items-start"
        >
          <motion.div
            variants={reveal}
            className="w-full flex flex-col h-full justify-center gap-2"
          >
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-normal text-title-color sm:text-6xl lg:text-7xl">
              Turn any link into a social post image.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-text-color sm:text-lg">
              Single Filter generates credible, platform-sized PNG exports for
              YouTube videos, GitHub repos, and websites, with strong defaults
              and just enough control.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/create"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-7 text-base font-bold text-bg transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
              >
                Open editor
                <span className="text-base transition-transform duration-200 group-hover:translate-x-0.5">
                  <Icon icon="lucide:arrow-right" />
                </span>
              </Link>
              <a
                href="#workflow"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border-color bg-panel-bg px-7 text-base font-bold text-title-color transition hover:bg-text-color/6 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
              >
                How it works
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section
        id="workflow"
        className="w-full bg-bg px-6 py-14 sm:px-8 lg:py-20"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold text-secondary-text">Workflow</p>
              <h2 className="mt-3 max-w-md text-4xl font-black leading-tight tracking-normal text-title-color lg:text-5xl">
                Built for the moment between finished and posted.
              </h2>
            </div>

            <div className="grid gap-4">
              {WORKFLOW.map((item) => (
                <div
                  key={item.step}
                  className="grid gap-4 rounded-xl border border-border-color bg-panel-bg p-5 sm:grid-cols-[112px_1fr] sm:items-start sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl font-black text-accent">
                      {item.step}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-color bg-bg text-accent">
                      <Icon icon={item.icon} className="text-lg" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-normal text-title-color">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-text-color">
                      {item.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="w-full border-t border-border-color bg-panel-bg px-6 py-14 sm:px-8 lg:py-20"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-bold text-secondary-text">FAQ</p>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-normal text-title-color lg:text-5xl">
              Small on purpose.
            </h2>
          </div>
          <div className="divide-y divide-border-color border-y border-border-color">
            {FAQ.map((faq) => (
              <details key={faq.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-black text-title-color">
                  {faq.q}
                  <Icon
                    icon="lucide:plus"
                    className="shrink-0 text-2xl text-accent transition group-open:rotate-45"
                  />
                </summary>
                <p className="mt-4 max-w-2xl text-base leading-7 text-text-color">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-[oklch(0.18_0.016_245)] px-6 py-14 text-[oklch(0.96_0.006_165)] sm:px-8 lg:py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-bold text-[oklch(0.74_0.12_165)]">
              Ready
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-normal lg:text-6xl">
              Make the link look as finished as the work behind it.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[oklch(0.9_0.01_245)]">
              Open the editor, paste the URL you are already sharing, and export
              a clean graphic in minutes.
            </p>
          </div>
          <Link
            to="/create"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[oklch(0.74_0.12_165)] px-6 text-base font-black text-[oklch(0.14_0.012_165)] transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[oklch(0.74_0.12_165)] focus:ring-offset-2 focus:ring-offset-[oklch(0.18_0.016_245)] sm:w-auto"
          >
            Open the editor
            <Icon icon="lucide:arrow-right" className="text-lg" />
          </Link>
        </div>
      </section>
    </div>
  );
};
