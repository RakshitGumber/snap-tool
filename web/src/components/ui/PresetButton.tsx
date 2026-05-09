export const PresetButton = () => {
  return (
    <div className="flex items-center">
      <div className="h-8 px-4 py-2.25">
        <h3 className="text-sm tracking-wide leading-3.5 select-none text-secondary-text ">
          Popular Presets
        </h3>
      </div>
      <button className="w-40 h-10.5 border border-border-color rounded-lg text-xs font-semibold hover:bg-text-color/8">
        Tw - 1080 x 1080
      </button>
    </div>
  );
};
