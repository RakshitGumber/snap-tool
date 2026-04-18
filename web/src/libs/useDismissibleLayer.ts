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

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [containerRef, isOpen]);
};
