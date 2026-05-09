import { Icon } from "@iconify/react";

export const Overview = () => {
  return (
    <>
      <div className="flex items-center gap-3 p-4 border-border-color border-b">
        <Icon
          icon="mingcute:grid-2-fill"
          fontSize={32}
          className="text-secondary-text"
        />
        <span className="text-xl font-medium tracking-wide">Overview</span>
      </div>
      <div className="flex flex-col flex-1 px-4">
        Hello{/* Add properties */}
      </div>
    </>
  );
};
