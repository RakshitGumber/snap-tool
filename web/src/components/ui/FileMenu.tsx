import { useRef, useState } from "react";
import { Icon } from "@iconify/react";

import { Logo } from "./Logo";

import { useRouter } from "@/stores/useRouter";
import { usePanelBlur } from "@/hooks/usePanelBlur";

export const FileMenu = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const setRoute = useRouter((state) => state.setRoute);

  const handleGoHome = () => {
    setRoute("/");
    setIsOpen(false);
  };

  usePanelBlur({
    containerRef,
    isOpen,
    onDismiss: () => setIsOpen(false),
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        className="flex items-center justify-center gap-2 w-fit transition ease-in hover:bg-text-color/8 px-2 rounded-lg outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Logo />
        <div className="h-full py-1 text-secondary-text">
          <Icon icon="mingcute:down-line" fontSize={28}></Icon>
        </div>
      </button>
      {isOpen && (
        <div className="absolute top-full z-50 mt-2 bg-panel-bg min-w-48 rounded-lg p-2 border-px border-border-color">
          <button
            onClick={handleGoHome}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-title-color transition hover:bg-text-color/8 cursor-pointer"
          >
            Go Home
          </button>
        </div>
      )}
    </div>
  );
};
