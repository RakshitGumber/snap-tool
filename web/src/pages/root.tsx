import { Features } from "@/Components/main/Features";
import { Footer } from "@/Components/main/Footer";
import { Hero } from "@/Components/main/Hero";
import { Mentions } from "@/Components/main/Mentions";

export const RootRoute = () => {
  return (
    <section className="max-w-7xl mx-auto flex flex-col items-center">
      <Hero />
      <Mentions />
      <Features />
      <Footer />
    </section>
  );
};
