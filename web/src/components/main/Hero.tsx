import { Link } from "@/pages/Router";
import { Icon } from "@iconify/react";
import { motion, type Variants } from "framer-motion";

const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const workflow = [
  {
    step: "01",
    title: "Paste the thing you are already sharing",
    copy: "Drop in a YouTube, GitHub, or website URL. Single Filter pulls the useful context and gives you a credible first layout.",
  },
  {
    step: "02",
    title: "Pick a frame, not a blank canvas",
    copy: "Choose a platform size, template treatment, and background. The controls stay tight so the export stays the point.",
  },
  {
    step: "03",
    title: "Export a post-ready PNG",
    copy: "Compare variants, make the small adjustments, then export a clean graphic for launch notes, threads, docs, or updates.",
  },
];

const linkTypes = [
  {
    name: "YouTube",
    detail: "Poster frames, creator splits, and cinematic video cards.",
    icon: "simple-icons:youtube",
    className: "lg:col-span-5 bg-[oklch(0.96_0.018_24)]",
  },
  {
    name: "GitHub",
    detail: "Repo launches, profile badges, and release-friendly snapshots.",
    icon: "simple-icons:github",
    className: "lg:col-span-4 bg-[oklch(0.94_0.014_165)]",
  },
  {
    name: "Websites",
    detail: "Browser windows, brand posters, and shareable site cards.",
    icon: "lucide:globe-2",
    className: "lg:col-span-3 bg-[oklch(0.95_0.013_245)]",
  },
];

const controls = [
  "Platform presets for square, portrait, and wide posts",
  "Background choices that support the graphic instead of stealing focus",
  "Template variants tuned to the link type",
  "A centered preview that behaves like the export you will ship",
];

const faqs = [
  {
    question: "Is this a full design suite?",
    answer:
      "No. Single Filter is intentionally smaller: paste a link, choose a strong default, make light edits, export.",
  },
  {
    question: "What kinds of posts is it for?",
    answer:
      "Launch announcements, repo highlights, YouTube promotion, website shares, changelog images, and quick creator updates.",
  },
  {
    question: "Why not just screenshot the page?",
    answer:
      "Screenshots are inconsistent. Single Filter turns the same source link into a clean, platform-sized graphic every time.",
  },
];

export const Hero = () => {
  return (
    <div className="w-full overflow-hidden">
      <section className="relative flex min-h-[96svh] w-full items-center justify-center px-6 pb-16 pt-28 sm:px-8 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-bg" />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-6xl flex-col items-start text-left"
        >
          <motion.div
            variants={reveal}
            className="flex max-w-5xl flex-col items-start"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border-2 border-accent/50 bg-panel-bg px-4 py-2 text-xs font-black text-title-color shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Link in. Post graphic out.
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-normal text-title-color sm:text-6xl lg:text-7xl">
              Ship better social images from any link.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-text-color sm:text-lg">
              Single Filter turns YouTube, GitHub, and website links into
              polished PNG graphics with strong defaults and just enough control.
            </p>
            <div className="mt-8 flex w-full max-w-lg flex-col justify-start gap-3 sm:flex-row">
              <Link
                to="/create"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-title-color transition duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
              >
                <Icon icon="lucide:sparkles" className="text-base" />
                Create a graphic
              </Link>
              <a
                href="#workflow"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border-color bg-panel-bg px-5 py-3 text-sm font-bold text-title-color transition duration-200 hover:bg-bg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
              >
                <Icon icon="lucide:arrow-down" className="text-base" />
                See the flow
              </a>
            </div>
            <div className="mt-5 inline-flex items-center gap-3 rounded-lg border border-border-color px-4 py-3 text-sm font-bold text-title-color">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-color text-accent">
                <Icon icon="lucide:link-2" className="text-base" />
              </span>
              Support any link
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section
        id="workflow"
        className="w-full border-y border-border-color bg-panel-bg px-6 py-16 sm:px-8 lg:py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">
              Workflow
            </p>
            <h2 className="mt-4 max-w-md text-4xl font-black leading-tight tracking-normal text-title-color lg:text-5xl">
              Built for the moment between finished and posted.
            </h2>
          </div>
          <div className="grid gap-4">
            {workflow.map((item) => (
              <article
                key={item.step}
                className="grid gap-4 rounded-2xl border border-border-color bg-bg p-5 sm:grid-cols-[88px_1fr] sm:p-6"
              >
                <span className="text-3xl font-black text-accent">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-2xl font-black tracking-normal text-title-color">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-text-color">
                    {item.copy}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="templates"
        className="w-full bg-bg px-6 py-16 sm:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <h2 className="max-w-2xl text-4xl font-black leading-tight tracking-normal text-title-color lg:text-5xl">
              Three source types, each with its own visual language.
            </h2>
            <p className="max-w-md text-lg leading-8 text-text-color">
              The templates follow the source, so a repo, video, and product
              link do not get flattened into the same generic tile.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-12">
            {linkTypes.map((type) => (
              <article
                key={type.name}
                className={`${type.className} min-h-72 rounded-2xl border border-border-color p-6 text-title-color`}
              >
                <Icon icon={type.icon} className="text-4xl" />
                <h3 className="mt-8 text-3xl font-black tracking-normal">
                  {type.name}
                </h3>
                <p className="mt-4 max-w-sm text-base leading-7 text-text-color">
                  {type.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-panel-bg px-6 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="rounded-[1.75rem] border border-border-color bg-bg p-4">
            <div className="rounded-[1.2rem] bg-[oklch(0.17_0.016_245)] p-5 text-[oklch(0.96_0.006_165)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-[oklch(0.74_0.12_165)]">
                  Current export
                </p>
                <button className="rounded-lg bg-[oklch(0.72_0.13_165)] px-4 py-2 text-sm font-black text-[oklch(0.14_0.012_165)]">
                  Export PNG
                </button>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {controls.map((control) => (
                  <div
                    key={control}
                    className="rounded-xl bg-[oklch(0.23_0.02_245)] p-4 text-sm font-semibold leading-6 text-[oklch(0.86_0.008_245)]"
                  >
                    {control}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">
              Control
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-normal text-title-color lg:text-5xl">
              Enough options to make it yours. Not enough to lose the afternoon.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-text-color">
              The landing page now mirrors the product promise: strong defaults,
              familiar controls, and a canvas that carries the expression.
            </p>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="w-full bg-bg px-6 py-16 sm:px-8 lg:py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-accent">
              Questions
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-normal text-title-color lg:text-5xl">
              A smaller tool on purpose.
            </h2>
          </div>
          <div className="divide-y divide-border-color border-y border-border-color">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-black text-title-color">
                  {faq.question}
                  <Icon
                    icon="lucide:plus"
                    className="shrink-0 text-2xl text-accent transition duration-200 group-open:rotate-45"
                  />
                </summary>
                <p className="mt-4 max-w-2xl text-base leading-7 text-text-color">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-[oklch(0.18_0.016_245)] px-6 py-16 text-[oklch(0.96_0.006_165)] sm:px-8 lg:py-24">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[oklch(0.74_0.12_165)]">
              Ready
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-normal lg:text-6xl">
              Make the link look as finished as the work behind it.
            </h2>
          </div>
          <Link
            to="/create"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[oklch(0.74_0.12_165)] px-5 py-3 text-base font-black text-[oklch(0.14_0.012_165)] transition duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[oklch(0.74_0.12_165)] focus:ring-offset-2 focus:ring-offset-[oklch(0.18_0.016_245)] sm:w-auto"
          >
            Open the editor
            <Icon icon="lucide:arrow-right" className="text-lg" />
          </Link>
        </div>
      </section>
    </div>
  );
};
