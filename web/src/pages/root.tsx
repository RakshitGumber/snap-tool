import { Footer } from "@/Components/main/Footer";
import { Hero } from "@/Components/main/Hero";
import { Navbar } from "@/Components/main/Navbar";

export const RootRoute = () => {
  return (
    <main className="flex flex-col items-center">
      <Navbar />
      <Hero />
      <Footer />
    </main>
  );
};
