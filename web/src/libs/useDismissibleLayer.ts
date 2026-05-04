import { useEffect, useEffectEvent, type RefObject } from "react";

export const useDismissibleLayer = <TElement extends HTMLElement>({
  containerRef,
  isOpen,
  onDismiss,
}: {
  containerRef: RefObject<TElement | null>;
  isOpen: boolean;
  onDismiss: () => void;
}) => {
  const handleDismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        handleDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, isOpen]);
};
