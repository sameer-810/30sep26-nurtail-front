import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-500.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/playfair-display/latin-500.css";
import "@fontsource/playfair-display/latin-600.css";
import "@fontsource/playfair-display/latin-500-italic.css";
import { Footer } from "./components/Footer";
import { Header, MobileCta, TopBar } from "./components/Header";
import { Privacy } from "./pages/Privacy";
import { Faq } from "./sections/Faq";
import { FinalCta } from "./sections/FinalCta";
import { Hero } from "./sections/Hero";
import { Mission } from "./sections/Mission";
import { Pilot } from "./sections/Pilot";
import { Platform } from "./sections/Platform";
import { Pricing } from "./sections/Pricing";
import { Problems } from "./sections/Problems";
import { Roles } from "./sections/Roles";
import { Trust } from "./sections/Trust";

/** Two static pages; no router needed. */
export function App({ path }: { path: string }) {
  if (path === "/privacy") {
    return (
      <>
        <TopBar />
        <Header />
        <Privacy />
        <Footer />
      </>
    );
  }
  return (
    <>
      <TopBar />
      <Header />
      <main id="main">
        <Hero />
        <Problems />
        <Platform />
        <Roles />
        <Trust />
        <Mission />
        <Pricing />
        <Pilot />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <MobileCta />
    </>
  );
}
