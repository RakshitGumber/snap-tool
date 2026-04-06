import { Icon } from "@iconify/react";
import { useTheme } from "../../providers/theme-context";

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const nextThemeLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <header className="border-b border-border-color bg-card/90 px-6 py-4 text-text-color backdrop-blur transition-colors duration-300">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="font-styled text-xl font-semibold tracking-tight">
            Snap Tool
          </p>
          <p className="text-sm text-text-color/70">
            Sketch faster with a theme that stays where you leave it.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={nextThemeLabel}
          title={nextThemeLabel}
          className="inline-flex items-center gap-3 rounded-full border border-border-color bg-bg px-4 py-2 text-sm font-medium text-text-color shadow-sm transition hover:scale-[1.02] hover:bg-text-color hover:text-bg focus:outline-none focus:ring-2 focus:ring-text-color/25"
        >
          <Icon
            icon={isDark ? "solar:sun-2-bold" : "solar:moon-stars-bold"}
            className="text-xl"
          />
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>
    </header>
  );
};
