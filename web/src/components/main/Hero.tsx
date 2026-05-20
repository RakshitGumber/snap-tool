import { Link } from "@/pages/Router";
import { useRouter } from "@/stores/useRouter";
import { Icon } from "@iconify/react";
import { motion, type Variants, useReducedMotion } from "framer-motion";
import { useMemo, useState, type FormEvent } from "react";

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

type ExampleTone = "youtube" | "github" | "website";
type ExampleSize = "square" | "portrait" | "wide";

const EXAMPLES: Array<{
  id: string;
  tone: ExampleTone;
  size: ExampleSize;
  title: string;
  subtitle: string;
  icon: string;
}> = [
  {
    id: "yt-square",
    tone: "youtube",
    size: "square",
    title: "New video, clean poster",
    subtitle: "Title + channel + date, no noise.",
    icon: "simple-icons:youtube",
  },
  {
    id: "yt-wide",
    tone: "youtube",
    size: "wide",
    title: "Trailer card",
    subtitle: "Wide crop that still reads.",
    icon: "simple-icons:youtube",
  },
  {
    id: "gh-portrait",
    tone: "github",
    size: "portrait",
    title: "Release notes snapshot",
    subtitle: "Repo name, tag, highlights.",
    icon: "simple-icons:github",
  },
  {
    id: "gh-square",
    tone: "github",
    size: "square",
    title: "Repo share card",
    subtitle: "Stars, language, tagline.",
    icon: "simple-icons:github",
  },
  {
    id: "web-portrait",
    tone: "website",
    size: "portrait",
    title: "Site poster",
    subtitle: "Brand first, URL second.",
    icon: "lucide:globe-2",
  },
  {
    id: "web-square",
    tone: "website",
    size: "square",
    title: "Product snapshot",
    subtitle: "Brand + URL frame.",
    icon: "lucide:globe-2",
  },
  {
    id: "web-wide",
    tone: "website",
    size: "wide",
    title: "Browser slice",
    subtitle: "A consistent frame every time.",
    icon: "lucide:globe-2",
  },
];

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

const toneStyles: Record<
  ExampleTone,
  { bg: string; tint: string; ink: string; chip: string; shadow: string }
> = {
  youtube: {
    bg: "bg-[oklch(0.96_0.02_24)]",
    tint: "bg-[oklch(0.92_0.03_24)]",
    ink: "text-[oklch(0.28_0.02_24)]",
    chip: "bg-[oklch(0.88_0.05_24)]",
    shadow: "shadow-[0_18px_40px_-18px_oklch(0.45_0.06_24/0.35)]",
  },
  github: {
    bg: "bg-[oklch(0.95_0.017_165)]",
    tint: "bg-[oklch(0.91_0.025_165)]",
    ink: "text-[oklch(0.25_0.02_165)]",
    chip: "bg-[oklch(0.87_0.04_165)]",
    shadow: "shadow-[0_18px_40px_-18px_oklch(0.43_0.05_165/0.35)]",
  },
  website: {
    bg: "bg-[oklch(0.95_0.014_245)]",
    tint: "bg-[oklch(0.91_0.02_245)]",
    ink: "text-[oklch(0.25_0.02_245)]",
    chip: "bg-[oklch(0.88_0.035_245)]",
    shadow: "shadow-[0_18px_40px_-18px_oklch(0.43_0.05_245/0.35)]",
  },
};

const sizeStyles: Record<ExampleSize, string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  wide: "aspect-[16/9]",
};

const ExportCard = ({
  tone,
  size,
  title,
  subtitle,
  icon,
  className,
}: {
  tone: ExampleTone;
  size: ExampleSize;
  title: string;
  subtitle: string;
  icon: string;
  className?: string;
}) => {
  const styles = toneStyles[tone];
  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-border-color",
        styles.bg,
        sizeStyles[size],
        styles.shadow,
        className ?? "",
      ].join(" ")}
    >
      <div className="absolute inset-0 opacity-[0.22]">
        <div className="absolute -left-10 -top-16 h-44 w-44 rounded-full bg-accent/25 blur-2xl" />
        <div className="absolute -right-12 -bottom-20 h-48 w-48 rounded-full bg-accent/18 blur-2xl" />
      </div>

      <div className="relative flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-color bg-panel-bg/70 px-3 py-1 text-xs font-bold text-title-color">
            <span className={["h-2 w-2 rounded-full", styles.chip].join(" ")} />
            Export
          </div>
          <div className="flex items-center gap-2 text-secondary-text">
            <Icon icon={icon} className="text-base" />
          </div>
        </div>

        <div className="mt-auto">
          <div className={["rounded-lg p-3", styles.tint].join(" ")}>
            <p className={["text-sm font-black leading-5", styles.ink].join(" ")}>
              {title}
            </p>
            <p className={["mt-1 text-xs font-semibold leading-4", styles.ink].join(" ")}>
              {subtitle}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold text-secondary-text">
            <span className="inline-flex items-center gap-1">
              <Icon icon="lucide:layers" className="text-sm" />
              Templates
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon icon="lucide:image" className="text-sm" />
              Background
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon icon="lucide:download" className="text-sm" />
              PNG
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportWall = ({
  size,
  accentTone,
}: {
  size: ExampleSize;
  accentTone: ExampleTone;
}) => {
  // Purposefully asymmetric, screenshot-like composition. No “random card on the right”.
  const hero = useMemo(() => {
    const candidates = EXAMPLES.filter((x) => x.size === size);
    // Ensure we always have one of each tone represented in the wall.
    const pickTone = (tone: ExampleTone) =>
      candidates.find((x) => x.tone === tone) ??
      EXAMPLES.find((x) => x.tone === tone && x.size === "square") ??
      EXAMPLES.find((x) => x.tone === tone) ??
      candidates[0] ??
      EXAMPLES[0]!;

    const yt = pickTone("youtube");
    const gh = pickTone("github");
    const web = pickTone("website");

    // Put the accent tone first so the composition feels intentional.
    const order: Array<typeof yt> =
      accentTone === "youtube"
        ? [yt, gh, web]
        : accentTone === "github"
          ? [gh, yt, web]
          : [web, yt, gh];

    return {
      a: order[0],
      b: order[1],
      c: order[2],
    };
  }, [size, accentTone]);

  return (
    <div className="relative w-full">
      <div className="absolute inset-x-0 -top-10 -z-10 h-56 bg-[radial-gradient(closest-side,oklch(0.78_0.09_165/0.22),transparent)]" />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-7">
          <ExportCard
            tone={hero.a.tone}
            size={size}
            title={hero.a.title}
            subtitle={hero.a.subtitle}
            icon={hero.a.icon}
            className="ring-1 ring-accent/25"
          />
        </div>
        <div className="col-span-12 sm:col-span-5 grid grid-cols-2 gap-4">
          <ExportCard
            tone={hero.b.tone}
            size="square"
            title={hero.b.title}
            subtitle={hero.b.subtitle}
            icon={hero.b.icon}
          />
          <ExportCard
            tone={hero.c.tone}
            size="square"
            title={hero.c.title}
            subtitle={hero.c.subtitle}
            icon={hero.c.icon}
          />
        </div>
      </div>
    </div>
  );
};

const Segmented = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string; icon: string }>;
  onChange: (id: string) => void;
}) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-secondary-text">{label}</span>
      <div className="inline-flex rounded-lg border border-border-color bg-panel-bg p-1">
        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={[
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                active
                  ? "bg-bg text-title-color shadow-sm"
                  : "text-secondary-text hover:bg-text-color/6 hover:text-title-color",
              ].join(" ")}
              aria-pressed={active}
            >
              <Icon icon={opt.icon} className="text-base" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const Hero = () => {
  const reduceMotion = useReducedMotion();
  const [url, setUrl] = useState("");
  const [size, setSize] = useState<ExampleSize>("square");
  const [tone, setTone] = useState<ExampleTone>("github");
  const setRoute = useRouter((s) => s.setRoute);

  const motionProps = reduceMotion
    ? { initial: false, animate: "visible" as const }
    : { initial: "hidden" as const, animate: "visible" as const };

  const handleStart = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    const next = trimmed.length ? `/create?url=${encodeURIComponent(trimmed)}` : "/create";
    setRoute(next);
  };

  return (
    <div className="w-full overflow-hidden">
      <section className="relative flex min-h-[96svh] w-full items-center justify-center px-6 pb-12 pt-24 sm:px-8 lg:pt-28">
        <div className="absolute inset-0 -z-10 bg-bg" />

        <motion.div
          variants={stagger}
          {...motionProps}
          className="flex w-full max-w-6xl flex-col items-start"
        >
          <motion.div variants={reveal} className="w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-color bg-panel-bg px-4 py-2 text-xs font-bold text-title-color shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Link in, post graphic out.
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-normal text-title-color sm:text-6xl lg:text-7xl">
              Turn any link into a social post image.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-text-color sm:text-lg">
              Single Filter generates credible, platform-sized PNG exports for YouTube videos, GitHub repos, and websites, with strong defaults and just enough control.
            </p>

            <form
              onSubmit={handleStart}
              className="mt-8 grid w-full gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            >
              <label className="sr-only" htmlFor="landing-link">
                Link to generate a graphic from
              </label>
              <input
                id="landing-link"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                inputMode="url"
                placeholder="Paste a YouTube, GitHub, or website URL"
                className="h-12 w-full rounded-lg border border-border-color bg-panel-bg px-4 text-sm font-semibold text-title-color placeholder:text-secondary-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-bg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
              >
                <Icon icon="lucide:sparkles" className="text-base" />
                Create
              </button>
              <a
                href="#examples"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border-color bg-panel-bg px-5 text-sm font-bold text-title-color transition hover:bg-text-color/6 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
              >
                <Icon icon="lucide:arrow-down" className="text-base" />
                See examples
              </a>
            </form>

            <div className="mt-10 flex w-full flex-col gap-4">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <Segmented
                  label="Size"
                  value={size}
                  onChange={(id) => setSize(id as ExampleSize)}
                  options={[
                    { id: "square", label: "Square", icon: "lucide:square" },
                    { id: "portrait", label: "Portrait", icon: "lucide:rectangle-vertical" },
                    { id: "wide", label: "Wide", icon: "lucide:rectangle-horizontal" },
                  ]}
                />
                <Segmented
                  label="Source"
                  value={tone}
                  onChange={(id) => setTone(id as ExampleTone)}
                  options={[
                    { id: "github", label: "GitHub", icon: "simple-icons:github" },
                    { id: "youtube", label: "YouTube", icon: "simple-icons:youtube" },
                    { id: "website", label: "Website", icon: "lucide:globe-2" },
                  ]}
                />
              </div>

              <motion.div variants={reveal}>
                <ExportWall size={size} accentTone={tone} />
              </motion.div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-secondary-text">
                <span className="inline-flex items-center gap-2 rounded-full border border-border-color bg-panel-bg px-4 py-2">
                  <Icon icon="lucide:layout-dashboard" className="text-base text-accent" />
                  Templates by source type
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border-color bg-panel-bg px-4 py-2">
                  <Icon icon="lucide:palette" className="text-base text-accent" />
                  Background presets
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border-color bg-panel-bg px-4 py-2">
                  <Icon icon="lucide:download" className="text-base text-accent" />
                  Export-ready PNG
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section
        id="examples"
        className="w-full border-t border-border-color bg-panel-bg px-6 py-14 sm:px-8 lg:py-20"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold text-secondary-text">Examples</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black leading-tight tracking-normal text-title-color lg:text-5xl">
                Three sources, three visual languages.
              </h2>
            </div>
            <p className="max-w-md text-lg leading-8 text-text-color">
              A video, a repo, and a product link should not look like the same generic tile.
            </p>
          </div>

          <div className="mt-10 grid gap-6">
            <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr] md:items-stretch">
              <ExportCard
                tone="github"
                size="wide"
                title="Repo launch cover"
                subtitle="Name, tagline, quick stats."
                icon="simple-icons:github"
              />
              <div className="grid grid-cols-2 gap-4">
                <ExportCard
                  tone="youtube"
                  size="square"
                  title="Episode cover"
                  subtitle="Readable at a glance."
                  icon="simple-icons:youtube"
                />
                <ExportCard
                  tone="website"
                  size="square"
                  title="Product snapshot"
                  subtitle="Brand + URL frame."
                  icon="lucide:globe-2"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-12 md:items-stretch">
              <div className="md:col-span-4">
                <ExportCard
                  tone="website"
                  size="portrait"
                  title="Site poster"
                  subtitle="A clean vertical rhythm."
                  icon="lucide:globe-2"
                />
              </div>
              <div className="md:col-span-8 grid gap-4 md:grid-cols-2">
                <ExportCard
                  tone="youtube"
                  size="wide"
                  title="Trailer card"
                  subtitle="Wide without losing text."
                  icon="simple-icons:youtube"
                />
                <ExportCard
                  tone="github"
                  size="square"
                  title="Release share"
                  subtitle="Tag, highlights, link."
                  icon="simple-icons:github"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-border-color bg-bg px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-color bg-panel-bg text-accent">
                <Icon icon="lucide:link-2" className="text-base" />
              </span>
              <p className="text-sm font-semibold text-title-color">
                Start from a link, not a blank canvas.
              </p>
            </div>
            <Link
              to="/create"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-bg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
            >
              Open editor
              <Icon icon="lucide:arrow-right" className="text-base" />
            </Link>
          </div>
        </div>
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
              Open the editor, paste the URL you are already sharing, and export a clean graphic in minutes.
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
