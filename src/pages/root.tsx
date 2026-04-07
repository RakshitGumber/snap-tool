import { Link } from "@/utils/Router";

export const RootRoute = () => {
  return (
    <div>
      Click this | <Link to="/create">Create</Link>
    </div>
  );
};
