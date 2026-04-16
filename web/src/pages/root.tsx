// import { Features } from "@/Components/main/Features";
import { Footer } from "@/Components/main/Footer";
import { Hero } from "@/Components/main/Hero";
// import { Mentions } from "@/Components/main/Mentions";
import { Navbar } from "@/Components/main/Navbar";

export const RootRoute = () => {
  return (
    <main className="flex flex-col items-center">
      <Navbar />
      <Hero />
      {/* <Mentions /> */}
      {/* <Features /> */}
      <Footer />
    </main>
  );
};
