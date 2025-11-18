import { Shield, Lock, Database, Zap, Cloud, RefreshCw } from 'lucide-react';
import { ReactIcon, TypeScriptIcon, SupabaseIcon, VercelIcon, TailwindIcon } from '@/assets/landing/tech';

interface Technology {
  name: string;
  logo: string;
  description: string;
}

interface SecurityFeature {
  icon: typeof Shield;
  name: string;
  description: string;
}

interface TechnologySectionProps {
  technologies: Technology[];
  securityFeatures: SecurityFeature[];
}

const logoComponents: Record<string, React.FC> = {
  react: ReactIcon,
  typescript: TypeScriptIcon,
  supabase: SupabaseIcon,
  vercel: VercelIcon,
  tailwind: TailwindIcon,
};

export const TechnologySection = ({ technologies, securityFeatures }: TechnologySectionProps) => {
  return (
    <section className="relative py-16 overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container relative mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        {/* Header orientado al cliente */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Confianza y Tranquilidad</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Tu Información <span className="text-primary">100% Segura</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
            Cumplimos con todas las normativas legales y utilizamos tecnología de última generación para proteger tus datos
          </p>
        </div>

        {/* Características de Seguridad - PRIMERO y más destacado */}
        <div className="mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <h4 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                      {feature.name}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges de confianza */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
            Certificaciones y Cumplimiento Legal
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-center">GDPR Compliant</span>
              <span className="text-xs text-muted-foreground text-center">Protección de Datos</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
              <Lock className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-center">SSL/TLS</span>
              <span className="text-xs text-muted-foreground text-center">Cifrado Total</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
              <Database className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-center">Backups Diarios</span>
              <span className="text-xs text-muted-foreground text-center">Sin Pérdida de Datos</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
              <Cloud className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-center">99.9% Uptime</span>
              <span className="text-xs text-muted-foreground text-center">Siempre Disponible</span>
            </div>
          </div>
        </div>

        {/* Tecnologías - SEGUNDO y más discreto */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Construido con tecnología de empresas líderes mundiales
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 hover:opacity-100 transition-opacity">
            {technologies.map((tech, index) => {
              const LogoComponent = logoComponents[tech.logo];
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all"
                  title={tech.description}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    {LogoComponent && <LogoComponent />}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {tech.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensaje de confianza final */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
            <Shield className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-foreground">
              Más de <span className="text-primary font-bold">10,000 empresas</span> confían en nuestra seguridad
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Export default icons for easy use
export const securityIcons = {
  Shield,
  Lock,
  Database,
  Zap,
  Cloud,
  RefreshCw,
};
