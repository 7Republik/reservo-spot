import { HeroSection } from "./HeroSection";
import { landingContent } from "@/data/landingContent";
import { useNavigate } from "react-router-dom";

/**
 * Ejemplo de uso del HeroSection
 * 
 * Este componente muestra cómo integrar el HeroSection
 * con el contenido de landingContent.ts
 */
export const HeroSectionExample = () => {
  const navigate = useNavigate();

  return (
    <HeroSection
      headline={landingContent.hero.headline}
      subheadline={landingContent.hero.subheadline}
      microclaim={landingContent.hero.microclaim}
      imageUrl={landingContent.hero.imageUrl}
      primaryCTA={{
        text: "Solicitar Demo",
        onClick: () => {
          // Navegar a formulario de contacto o abrir modal
          console.log("Solicitar Demo clicked");
          // navigate("/contact");
        },
      }}
      secondaryCTA={{
        text: "Ver Características",
        onClick: () => {
          // Scroll a sección de características
          console.log("Ver Características clicked");
          const featuresSection = document.getElementById("features");
          featuresSection?.scrollIntoView({ behavior: "smooth" });
        },
      }}
    />
  );
};
