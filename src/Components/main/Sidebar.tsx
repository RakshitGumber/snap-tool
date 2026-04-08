import { useState, useEffect } from "react";

export const Sidebar = () => {
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: any) => {
      if (!isResizing) return;

      let newWidth = e.clientX;

      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;

      setWidth(newWidth);
    };

    const handleDoubleClick = () => {
      setWidth(320);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = "auto";
    };

    document.addEventListener("dblclick", handleDoubleClick);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [isResizing]);

  const startResizing = () => {
    setIsResizing(true);
    document.body.style.userSelect = "none";
  };

  return (
    <section
      style={{ width: `${width}px` }}
      className="flex flex-col items-center py-4 gap-8 relative h-full border-r-2 border-border-color shrink-0"
    >
      <div>1</div>
      <div>2</div>
      <div className="absolute bottom-0 py-4">3</div>

      <div
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-10 hover:bg-accent-light active:bg-accent transition-colors"
      />
    </section>
  );
};
