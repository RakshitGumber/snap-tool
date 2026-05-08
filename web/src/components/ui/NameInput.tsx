import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { usePanelBlur } from "@/hooks/usePanelBlur";

export const NameInput = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState<string>("Untitled");
  const [edit, setEdit] = useState<boolean>(false);

  usePanelBlur({
    containerRef,
    isOpen: edit,
    onDismiss: () => setEdit(false),
  });

  return (
    <div
      ref={containerRef}
      className="px-6 relative h-10.5 border-l border-r border-border-color"
    >
      {edit ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-38 px-2 py-1.25 text-sm tracking-wider font-medium min-w-38 rounded-lg hover:bg-text-color/8 hover:outline outline-border-color cursor-pointer h-full"
        />
      ) : (
        <div
          className="flex justify-between items-end px-2 py-1.25 text-xl tracking-wider font-medium text-title-color min-w-38 rounded-lg hover:bg-text-color/8 hover:outline outline-border-color cursor-pointer"
          onClick={() => setEdit(true)}
        >
          <div>{title}</div>
          <div className="text-secondary-text px-1 py-0.75">
            <Icon icon="mingcute:edit-3-line" fontSize={24} />
          </div>
        </div>
      )}
    </div>
  );
};
