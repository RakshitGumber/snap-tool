import { Footer } from "@/components/main/Footer";
import { Navbar } from "@/components/main/Navbar";

export const About = () => {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-bg">
      <Navbar />

      <section className="relative flex w-full justify-center px-6 pt-32 pb-16 sm:px-8 lg:px-10"></section>

      <Footer />
    </main>
  );
};
