export const TopPanel = ({ children }: { children: React.ReactNode }) => {
  return (
    <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-2xl">
      {children}
    </header>
  );
};
