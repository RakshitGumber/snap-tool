import { addCanvas } from "@/Canvas";
import { useEffect } from "react";

export const Canvas = () => {
  useEffect(() => {
    addCanvas(".main-canvas");
  }, []);

  return (
    <div className="h-full flex-1 flex items-center justify-center">
      <div className="main-canvas h-full w-full" />
    </div>
  );
};
