import { Link, type RoutePath } from "@/utils/Router";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

const buttonClassName =
  "inline-flex h-10 items-center justify-center rounded-full border border-border-color/70 bg-card px-4 text-sm font-medium text-text-color transition-colors duration-200 hover:bg-card/70";

export const Navbar = ({ route }: { route: RoutePath }) => {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    if (shareState === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => setShareState("idle"), 1800);

    return () => window.clearTimeout(timeout);
  }, [shareState]);

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Snap Tool",
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareState("copied");
    } catch {
      // Ignore share cancellations and clipboard failures.
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-2xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <h1 className="font-styled text-xl text-title-color font-bold tracking-wider uppercase">
          Snap Tool
        </h1>
        <div className="flex items-center gap-3">
          {route === "/create" ? (
            <button
              aria-label="Share current project"
              className={`${buttonClassName} gap-2`}
              onClick={handleShare}
              type="button"
            >
              <Icon icon="solar:share-outline" className="text-base" />
              {shareState === "copied" ? "Copied" : "Share"}
            </button>
          ) : null}
          <Link to="/create" className={`${buttonClassName} gap-2`}>
            <Icon icon="solar:add-square-outline" className="text-base" />
            Create
          </Link>
        </div>
      </nav>
    </header>
  );
};
