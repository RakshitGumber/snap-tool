interface ILogo {
  state?: "expanded" | "closed";
}

export const Logo = ({ state = "closed" }: ILogo) => {
  return (
    <div className="flex gap-1.5 min-w-fit items-center">
      <img src="/logo/logo.png" alt="logo" className="w-10.5 h-10.5 p-1.5" />
      {state === "expanded" && (
        <h1 className="font-sans font-bold text-2xl tracking-wider text-title-color">
          Single Filter
        </h1>
      )}
    </div>
  );
};
