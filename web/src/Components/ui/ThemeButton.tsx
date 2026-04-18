import { useTheme } from "@/providers/useTheme";
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
      className="rounded-lg px-2 py-2 text-title-color transition hover:border-accent hover:bg-secondary-text/20"
    >
      <Icon
        icon={!darkMode ? "solar:sun-2-bold" : "solar:moon-stars-bold"}
        className="text-xl"
      />
    </button>
  );
};
