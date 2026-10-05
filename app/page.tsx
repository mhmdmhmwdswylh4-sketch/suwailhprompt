import Hero from "@/components/hero";
import { CategoryMarquee, Demo, Features, FinalCta, Footer, HowItWorks } from "@/components/landing-sections";

export default function Home() {
  return (
    <main>
      <Hero />
      <CategoryMarquee />
      <Demo />
      <HowItWorks />
      <Features />
      <FinalCta />
      <Footer />
    </main>
  );
}
