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
      className="gap-2 rounded-full border border-border-color bg-bg/80 px-2 py-2 text-title-color transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent-light/40"
    >
      <Icon icon={darkMode ? "solar:sun-2-bold" : "solar:moon-stars-bold"} />
    </button>
  );
};
