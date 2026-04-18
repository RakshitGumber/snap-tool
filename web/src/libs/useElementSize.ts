import { useEffect, useState, type RefObject } from "react";

type ElementSize = {
  width: number;
  height: number;
};

const EMPTY_SIZE: ElementSize = {
  width: 0,
  height: 0,
};

export const useElementSize = <TElement extends HTMLElement>(
  ref: RefObject<TElement | null>,
) => {
  const [size, setSize] = useState<ElementSize>(EMPTY_SIZE);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};
