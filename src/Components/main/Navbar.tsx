import { useTheme } from "@/providers/ThemeProvider";
import { Icon } from "@iconify/react";

export const Navbar = () => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border-color bg-card/90 px-6 py-4 text-text-color backdrop-blur transition-colors duration-300">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div>
          <h1 className="font-styled text-xl font-bold tracking-wider">
            Snap Tool
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2"
        >
          <Icon
            icon={theme === "light" ? "solar:sun-bold" : "solar:moon-bold"}
            className="text-xl"
          />
        </button>
      </div>
    </header>
  );
};
