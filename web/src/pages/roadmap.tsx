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

const roadmapPhases = [
  {
    phase: "Phase 01",
    title: "Foundation",
    status: "Done",
    icon: "solar:widget-5-bold-duotone",
    description:
      "Establish the core editing canvas, theme system, routing, and the baseline interaction model for the product.",
    goals: [
      "Ship the initial canvas experience",
      "Create the theme tokens and shared layout shell",
      "Set up the upload and board state plumbing",
    ],
  },
  {
    phase: "Phase 02",
    title: "Composition Tools",
    status: "In Progress",
    icon: "solar:pen-new-square-bold-duotone",
    description:
      "Improve the actual post-making workflow with better text handling, more predictable composition controls, and faster asset placement.",
    goals: [
      "Expand text editing and draft ergonomics",
      "Tighten background, preset, and upload controls",
      "Reduce friction in arranging final visual content",
    ],
  },
  {
    phase: "Phase 03",
    title: "Export and Publishing",
    status: "Planned",
    icon: "solar:share-circle-bold-duotone",
    description:
      "Make the handoff from editor to published asset feel complete with stronger export flows and reusable output options.",
    goals: [
      "Improve export quality and output presets",
      "Support reusable layouts or starter compositions",
      "Add faster save-and-share paths for repeat work",
    ],
  },
  {
    phase: "Phase 04",
    title: "Polish and Scale",
    status: "Future",
    icon: "solar:stars-bold-duotone",
    description:
      "Refine the product once the main workflow is solid, with better onboarding, performance tuning, and a more mature content system.",
    goals: [
      "Tune perceived speed and editor responsiveness",
      "Strengthen mobile and tablet behavior",
      "Add guidance for first-time creators and teams",
    ],
  },
];

const overviewCards = [
  { label: "Current focus", value: "Composition workflow" },
  { label: "Product direction", value: "Fast social graphics" },
  { label: "Priority", value: "Less friction, cleaner output" },
];

const statusToneMap: Record<string, string> = {
  Done: "bg-accent/15 text-accent border-accent/30",
  "In Progress": "bg-title-color/10 text-title-color border-title-color/15",
  Planned: "bg-secondary-text/10 text-secondary-text border-border-color",
  Future: "bg-secondary-text/10 text-secondary-text border-border-color",
};

export const Roadmap = () => {
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
            className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end"
          >
            <div className="flex flex-col gap-6">
              <h1 className="max-w-4xl font-sans text-4xl font-bold tracking-wider text-title-color leading-snug sm:text-5xl md:text-6xl">
                The next phases for turning Single Filter into a sharper, faster
                post-making tool.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-text-color sm:text-xl">
                This roadmap organizes the project into practical delivery
                phases, starting with core editor foundations and moving toward
                better composition, stronger exports, and overall polish.
              </p>
            </div>

            <div className="rounded-4xl border border-border-color bg-card-bg/90 p-6 shadow-sm backdrop-blur-xl">
              <p className="font-sans text-sm font-bold uppercase tracking-[0.28em] text-accent">
                Roadmap intent
              </p>
              <p className="mt-4 text-lg leading-8 text-text-color">
                Keep the product focused. Each phase should make the editor more
                useful in real creation work instead of adding feature noise.
              </p>
            </div>
          </motion.div>

          <motion.div
            custom={0.2}
            initial="hidden"
            animate="visible"
            variants={sectionReveal}
            className="grid gap-4 md:grid-cols-3"
          >
            {overviewCards.map((card) => (
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

      <section className="relative flex w-full justify-center px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex w-full max-w-7xl flex-col gap-5">
          {roadmapPhases.map((item, index) => (
            <motion.article
              key={item.phase}
              custom={0.12 + index * 0.08}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={sectionReveal}
              className="rounded-4xl border border-border-color bg-card-bg p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light/60 text-3xl text-accent">
                        <Icon icon={item.icon} />
                      </div>
                      <div>
                        <p className="font-sans text-sm font-bold uppercase tracking-[0.28em] text-accent">
                          {item.phase}
                        </p>
                        <h2 className="mt-2 font-sans text-3xl font-bold tracking-wide text-title-color">
                          {item.title}
                        </h2>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-4 py-2 font-sans text-sm font-bold tracking-wide ${statusToneMap[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="max-w-2xl text-lg leading-8 text-text-color">
                    {item.description}
                  </p>
                </div>

                <div className="rounded-3xl border border-border-color bg-bg/65 p-6">
                  <p className="font-sans text-sm font-bold uppercase tracking-[0.24em] text-secondary-text">
                    Phase goals
                  </p>
                  <div className="mt-5 flex flex-col gap-4">
                    {item.goals.map((goal) => (
                      <div
                        key={goal}
                        className="flex items-start gap-3 rounded-2xl border border-border-color bg-card-bg px-4 py-4"
                      >
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                        <p className="text-base leading-7 text-text-color sm:text-lg">
                          {goal}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative flex w-full justify-center px-6 pt-10 pb-20 sm:px-8 lg:px-10">
        <motion.div
          custom={0.15}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionReveal}
          className="w-full max-w-7xl rounded-[2.25rem] border border-accent/25 bg-card-bg p-8 shadow-sm sm:p-10 lg:p-12"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-sans text-sm font-bold uppercase tracking-[0.28em] text-accent">
                Build next
              </p>
              <h2 className="mt-4 font-sans text-3xl font-bold tracking-wide text-title-color sm:text-4xl">
                Move from roadmap to the editor and keep shipping the core
                workflow.
              </h2>
              <p className="mt-4 text-lg leading-8 text-text-color">
                The roadmap matters only if it sharpens delivery. The next
                useful work is inside the product itself.
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
