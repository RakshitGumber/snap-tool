import { Icon } from "@iconify/react";

import { useTheme } from "@/providers/useTheme";

type ThemeButtonProps = {
  variant?: "icon" | "menu";
  onClick?: () => void;
};

const isDarkTheme = (theme: "dark" | "light" | "system") => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  return theme === "dark";
};

export const ThemeButton = ({
  variant = "icon",
  onClick,
}: ThemeButtonProps) => {
  const { theme, setTheme } = useTheme();
  const darkMode = isDarkTheme(theme);
  const nextTheme = darkMode ? "light" : "dark";
  const label = darkMode ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(nextTheme);
        onClick?.();
      }}
      className={
        variant === "menu"
          ? "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-title-color transition hover:bg-secondary-text/20"
          : "rounded-lg px-2 py-2 text-title-color transition hover:border-accent hover:bg-secondary-text/20"
      }
    >
      <Icon
        icon={!darkMode ? "solar:sun-2-bold" : "solar:moon-stars-bold"}
        className={variant === "menu" ? "text-lg" : "text-xl"}
      />
      {variant === "menu" ? <span>{label}</span> : null}
    </button>
  );
};
