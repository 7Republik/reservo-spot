import { useNavigate } from "react-router-dom";
import { landingContent } from "@/data/landingContent";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemsSection } from "@/components/landing/ProblemsSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { SolutionsProgressNav } from "@/components/landing/SolutionsProgressNav";
import { FeaturesDetailSection } from "@/components/landing/FeaturesDetailSection";
import { BenefitsByRoleSection } from "@/components/landing/BenefitsByRoleSection";
import { KeyBenefitsSection } from "@/components/landing/KeyBenefitsSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { TechnologySection } from "@/components/landing/TechnologySection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { Footer } from "@/components/landing/Footer";
import { SectionDivider } from "@/components/landing/SectionDivider";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Hero Section - Full width */}
      <section id="hero" className="w-full">
        <HeroSection
          headline={landingContent.hero.headline}
          subheadline={landingContent.hero.subheadline}
          microclaim={landingContent.hero.microclaim}
          primaryCTA={{
            text: "Solicitar Demo",
            onClick: () => navigate("/auth")
          }}
          secondaryCTA={{
            text: "Ver Características",
            onClick: () => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          imageUrl={landingContent.hero.imageUrl}
        />
      </section>

      {/* Transición Hero -> Problems */}
      <SectionDivider 
        variant="fluid" 
        intensity="subtle"
        fromColor="bg-gradient-to-b from-blue-950/50 via-indigo-950/30 to-background"
        toColor="bg-background"
      />

      {/* Problems Section */}
      <section id="problems">
        <ProblemsSection />
      </section>

      {/* Transición Problems -> Solutions */}
      <SectionDivider 
        variant="gradient-mesh" 
        intensity="medium"
        fromColor="bg-background"
        toColor="bg-muted/20"
      />

      {/* Solutions Section */}
      <section id="solutions" className="bg-muted/20">
        <SolutionsSection
          title="Cómo RESERVEO Resuelve Esto"
          solutions={landingContent.solutions}
        />
        {/* Navegación flotante con progreso */}
        <SolutionsProgressNav 
          solutions={landingContent.solutions.map(s => ({ id: s.id, title: s.title }))}
          sectionId="solutions"
        />
      </section>

      {/* Transición Solutions -> Features */}
      <SectionDivider 
        variant="fluid" 
        intensity="subtle"
        fromColor="bg-muted/20"
        toColor="bg-background"
      />

      {/* Features Detail Section */}
      <section id="features">
        <FeaturesDetailSection modules={landingContent.modules} />
      </section>

      {/* Transición Features -> Benefits */}
      <SectionDivider 
        variant="layered" 
        intensity="medium"
        fromColor="bg-background"
        toColor="bg-accent/5"
      />

      {/* Benefits by Role Section */}
      <section id="benefits" className="bg-accent/5">
        <BenefitsByRoleSection
          title="Para Cada Miembro de tu Equipo"
          subtitle="RESERVEO ofrece beneficios específicos según tu rol en la empresa"
          roleBenefits={landingContent.roleBenefits}
        />
      </section>

      {/* Transición Benefits -> Key Benefits */}
      <SectionDivider 
        variant="gradient-mesh" 
        flip
        intensity="subtle"
        fromColor="bg-accent/5"
        toColor="bg-background"
      />

      {/* Key Benefits Section */}
      <section id="key-benefits">
        <KeyBenefitsSection benefits={landingContent.keyBenefits} />
      </section>

      {/* Transición Key Benefits -> Use Cases */}
      <SectionDivider 
        variant="fluid" 
        intensity="medium"
        fromColor="bg-background"
        toColor="bg-muted/15"
      />

      {/* Use Cases Section */}
      <section id="use-cases" className="bg-muted/15">
        <UseCasesSection
          title="Casos de Uso"
          useCases={landingContent.useCases}
        />
      </section>

      {/* Transición Use Cases -> Comparison */}
      <SectionDivider 
        variant="organic" 
        flip
        intensity="subtle"
        fromColor="bg-muted/15"
        toColor="bg-background"
      />

      {/* Comparison Section */}
      <section id="comparison">
        <ComparisonSection />
      </section>

      {/* Transición Comparison -> Technology */}
      <SectionDivider 
        variant="gradient-mesh" 
        intensity="medium"
        fromColor="bg-background"
        toColor="bg-primary/5"
      />

      {/* Technology Section */}
      <section id="technology" className="bg-primary/5">
        <TechnologySection
          technologies={landingContent.technologies}
          securityFeatures={landingContent.securityFeatures}
        />
      </section>

      {/* Transición Technology -> Pricing */}
      <SectionDivider 
        variant="fluid" 
        intensity="subtle"
        fromColor="bg-primary/5"
        toColor="bg-background"
      />

      {/* Pricing Section */}
      <section id="pricing">
        <PricingSection tiers={landingContent.pricingTiers} />
      </section>

      {/* Transición Pricing -> FAQ */}
      <SectionDivider 
        variant="layered" 
        flip
        intensity="medium"
        fromColor="bg-background"
        toColor="bg-muted/20"
      />

      {/* FAQ Section */}
      <section id="faq" className="bg-muted/20">
        <FAQSection />
      </section>

      {/* Transición FAQ -> Final CTA */}
      <SectionDivider 
        variant="gradient-mesh" 
        intensity="medium"
        fromColor="bg-muted/20"
        toColor="bg-gradient-to-b from-primary/8 to-primary/15"
      />

      {/* Final CTA Section */}
      <section id="cta" className="bg-gradient-to-b from-primary/8 to-primary/15">
        <FinalCTASection
          headline={landingContent.finalCTA.headline}
          subheadline={landingContent.finalCTA.subheadline}
          onPrimaryClick={() => navigate("/auth")}
          onSecondaryClick={() => navigate("/contact")}
        />
      </section>

      {/* Footer */}
      <Footer
        columns={landingContent.footer.columns}
        socialLinks={landingContent.footer.socialLinks}
      />
    </div>
  );
};

export default Index;