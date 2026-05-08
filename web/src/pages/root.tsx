import { Footer } from "@/components/main/Footer";
import { Hero } from "@/components/main/Hero";
import { Navbar } from "@/components/main/Navbar";

export const RootRoute = () => {
  return (
    <main className="flex flex-col items-center">
      <Navbar />
      <Hero />
      <Footer />
    </main>
  );
};
