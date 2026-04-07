import { Link } from "@/utils/Router";

export const RootRoute = () => {
  return (
    <section className="flex h-full items-center justify-center px-4">
      <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-border-color/60 bg-card/70 px-8 py-10 text-center shadow-[0_20px_70px_rgba(16,16,30,0.08)] backdrop-blur-sm">
        <p className="font-styled text-3xl text-text-color">Snap Tool</p>
        <p className="max-w-md text-sm text-text-color/70">
          Start a new canvas from the minimal workspace.
        </p>
        <Link
          to="/create"
          className="inline-flex h-10 items-center justify-center rounded-full border border-border-color/70 bg-bg px-4 text-sm font-medium text-text-color transition-colors duration-200 hover:bg-bg/80"
        >
          Open Create
        </Link>
      </div>
    </section>
  );
};
