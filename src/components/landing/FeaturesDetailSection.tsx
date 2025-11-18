import { Module } from '@/data/landingContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface FeaturesDetailSectionProps {
  modules: Module[];
}

export const FeaturesDetailSection = ({ modules }: FeaturesDetailSectionProps) => {
  const { ref: headerRef, isVisible: headerVisible, prefersReducedMotion } = useScrollAnimation();
  const { ref: tabsRef, isVisible: tabsVisible } = useScrollAnimation({
    threshold: 0.1,
  });

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case 'new':
        return <Sparkles className="h-3 w-3" />;
      case 'popular':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <section className="relative py-10 sm:py-12 md:py-16 overflow-hidden">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      {/* Decoración de fondo - círculos */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        {/* Título de la sección compacto */}
        <div 
          ref={headerRef as any}
          className={`text-center mb-6 sm:mb-8 ${getAnimationClasses(headerVisible, 'fadeInUp', prefersReducedMotion)}`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-3">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Funcionalidades Completas</span>
          </div>
          
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2 px-2">
            Características <span className="text-primary">Detalladas</span>
          </h2>
          
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            Explora las funcionalidades específicas de cada módulo del sistema
          </p>
        </div>

        {/* Tabs de módulos compactos */}
        <div 
          ref={tabsRef as any}
          className={getAnimationClasses(tabsVisible, 'fadeInUp', prefersReducedMotion)}
        >
          <Tabs defaultValue={modules[0]?.id} className="w-full">
            {/* Lista de tabs compacta */}
            <TabsList className="w-full h-auto flex-wrap justify-center gap-1.5 sm:gap-2 bg-card/50 backdrop-blur-sm border border-border/50 p-1.5 sm:p-2 mb-5 sm:mb-6 rounded-lg shadow-md">
              {modules.map((module, index) => (
                <TabsTrigger
                  key={module.id}
                  value={module.id}
                  className={cn(
                    "group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md",
                    "transition-all duration-200",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                    "data-[state=inactive]:hover:bg-muted",
                    "border border-transparent data-[state=active]:border-primary/20"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <module.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:scale-110" />
                  <span className="font-semibold">{module.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Contenido de cada tab compacto */}
            {modules.map((module, moduleIndex) => (
              <TabsContent
                key={module.id}
                value={module.id}
                className="mt-4 focus-visible:outline-none focus-visible:ring-0"
              >
                <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative">
                    {/* Header del módulo compacto */}
                    <div className="flex items-center gap-3 mb-5">
                      {/* Icono compacto */}
                      <div className="relative">
                        <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/20">
                          <module.icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                          {module.name}
                          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Funcionalidades principales del módulo
                        </p>
                      </div>
                    </div>

                    {/* Lista de características compacta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {module.features.map((feature, index) => (
                        <div
                          key={index}
                          className={cn(
                            "group/feature relative flex items-center gap-2.5 p-3 rounded-lg",
                            "bg-gradient-to-br from-muted/50 to-muted/30",
                            "border border-border/50",
                            "hover:border-primary/30 hover:shadow-md",
                            "transition-all duration-200"
                          )}
                        >
                          {/* Icono de check compacto */}
                          <div className="flex-shrink-0">
                            <div className="p-1 bg-primary/10 rounded-full group-hover/feature:bg-primary/20 transition-colors">
                              <Check className="h-3.5 w-3.5 text-primary" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium text-foreground group-hover/feature:text-primary transition-colors">
                                {feature.name}
                              </span>
                              
                              {feature.badge && (
                                <Badge
                                  variant={feature.badge === 'new' ? 'default' : 'secondary'}
                                  className="text-[10px] flex items-center gap-0.5 px-1.5 py-0 h-4"
                                >
                                  {getBadgeIcon(feature.badge)}
                                  {feature.badge === 'new' ? 'Nuevo' : 'Popular'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};
