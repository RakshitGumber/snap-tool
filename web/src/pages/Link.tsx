import type { ReactNode } from "react";

import { useRouter } from "./useRouter";

export const Link = ({
  to,
  children,
  className,
}: {
  to: string;
  children?: ReactNode;
  className?: string;
}) => {
  const setRoute = useRouter((state) => state.setRoute);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.ctrlKey || event.metaKey || event.button !== 0) return;

    event.preventDefault();
    setRoute(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};
