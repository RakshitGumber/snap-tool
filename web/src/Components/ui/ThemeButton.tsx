import { useTheme } from "@/providers/ThemeProvider";
import { Icon } from "@iconify/react";

const isDarkTheme = (theme: "dark" | "light" | "system") => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  return theme === "dark";
};

export const ThemeButton = () => {
  const { theme, setTheme } = useTheme();
  const darkMode = isDarkTheme(theme);
  const nextTheme = darkMode ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
      className="group flex items-center gap-2 rounded-full border border-border-color bg-bg/80 px-2 py-2 text-title-color transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent-light/40"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-accent-light text-xl text-title-color transition group-hover:bg-accent group-hover:text-bg">
        <Icon icon={darkMode ? "solar:sun-2-bold" : "solar:moon-stars-bold"} />
      </span>
      <span className="hidden min-w-0 flex-col pr-2 text-left sm:flex">
        <span className="text-[0.6rem] uppercase tracking-[0.28em] text-secondary-text">
          Theme
        </span>
        <span className="font-styled text-xs font-bold uppercase tracking-[0.24em] text-title-color">
          {darkMode ? "Dark" : "Light"}
        </span>
      </span>
    </button>
  );
};

