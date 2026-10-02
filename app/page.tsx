import Hero from "@/components/hero";
import { Demo, Features, FinalCta, Footer, HowItWorks } from "@/components/landing-sections";

export default function Home() {
  return (
    <main>
      <Hero />
      <Demo />
      <HowItWorks />
      <Features />
      <FinalCta />
      <Footer />
    </main>
  );
}
