import { cn } from '@/lib/utils';

interface SectionDividerProps {
  variant?: 'wave' | 'blob' | 'curve' | 'organic' | 'layered' | 'smooth' | 'gradient-mesh' | 'fluid';
  flip?: boolean;
  fromColor?: string;
  toColor?: string;
  className?: string;
  animated?: boolean;
  intensity?: 'subtle' | 'medium' | 'strong';
}

export const SectionDivider = ({
  variant = 'fluid',
  flip = false,
  fromColor = 'bg-background',
  toColor = 'bg-accent/10',
  className,
  animated = true,
  intensity = 'medium',
}: SectionDividerProps) => {
  const renderShape = () => {
    switch (variant) {
      case 'wave':
        return (
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className={cn('w-full h-full', flip && 'scale-y-[-1]')}
          >
            <path
              d="M0,0 C300,80 600,80 900,40 C1050,20 1150,0 1200,0 L1200,120 L0,120 Z"
              className="fill-current"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="15s"
                  repeatCount="indefinite"
                  values="
                    M0,0 C300,80 600,80 900,40 C1050,20 1150,0 1200,0 L1200,120 L0,120 Z;
                    M0,20 C300,60 600,100 900,60 C1050,40 1150,20 1200,20 L1200,120 L0,120 Z;
                    M0,0 C300,80 600,80 900,40 C1050,20 1150,0 1200,0 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
          </svg>
        );

      case 'curve':
        return (
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className={cn('w-full h-full', flip && 'scale-y-[-1]')}
          >
            <path
              d="M0,0 Q600,120 1200,0 L1200,120 L0,120 Z"
              className="fill-current"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="12s"
                  repeatCount="indefinite"
                  values="
                    M0,0 Q600,120 1200,0 L1200,120 L0,120 Z;
                    M0,20 Q600,100 1200,20 L1200,120 L0,120 Z;
                    M0,0 Q600,120 1200,0 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
          </svg>
        );

      case 'organic':
        return (
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className={cn('w-full h-full', flip && 'scale-y-[-1]')}
          >
            <path
              d="M0,0 C150,60 300,90 450,80 C600,70 750,40 900,60 C1050,80 1150,50 1200,20 L1200,120 L0,120 Z"
              className="fill-current"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="18s"
                  repeatCount="indefinite"
                  values="
                    M0,0 C150,60 300,90 450,80 C600,70 750,40 900,60 C1050,80 1150,50 1200,20 L1200,120 L0,120 Z;
                    M0,20 C150,80 300,70 450,100 C600,90 750,60 900,80 C1050,60 1150,70 1200,40 L1200,120 L0,120 Z;
                    M0,10 C150,70 300,80 450,90 C600,80 750,50 900,70 C1050,70 1150,60 1200,30 L1200,120 L0,120 Z;
                    M0,0 C150,60 300,90 450,80 C600,70 750,40 900,60 C1050,80 1150,50 1200,20 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
          </svg>
        );

      case 'layered':
        return (
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className={cn('w-full h-full', flip && 'scale-y-[-1]')}
          >
            {/* Capa 1 - Fondo */}
            <path
              d="M0,40 C300,80 600,60 900,80 C1050,90 1150,70 1200,60 L1200,120 L0,120 Z"
              className="fill-current opacity-30"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="20s"
                  repeatCount="indefinite"
                  values="
                    M0,40 C300,80 600,60 900,80 C1050,90 1150,70 1200,60 L1200,120 L0,120 Z;
                    M0,60 C300,60 600,80 900,60 C1050,70 1150,90 1200,80 L1200,120 L0,120 Z;
                    M0,40 C300,80 600,60 900,80 C1050,90 1150,70 1200,60 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
            
            {/* Capa 2 - Media */}
            <path
              d="M0,60 C300,100 600,80 900,100 C1050,110 1150,90 1200,80 L1200,120 L0,120 Z"
              className="fill-current opacity-50"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="16s"
                  repeatCount="indefinite"
                  values="
                    M0,60 C300,100 600,80 900,100 C1050,110 1150,90 1200,80 L1200,120 L0,120 Z;
                    M0,80 C300,80 600,100 900,80 C1050,90 1150,110 1200,100 L1200,120 L0,120 Z;
                    M0,60 C300,100 600,80 900,100 C1050,110 1150,90 1200,80 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
            
            {/* Capa 3 - Frente */}
            <path
              d="M0,80 C300,110 600,100 900,110 C1050,115 1150,105 1200,100 L1200,120 L0,120 Z"
              className="fill-current"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="14s"
                  repeatCount="indefinite"
                  values="
                    M0,80 C300,110 600,100 900,110 C1050,115 1150,105 1200,100 L1200,120 L0,120 Z;
                    M0,100 C300,100 600,110 900,100 C1050,105 1150,115 1200,110 L1200,120 L0,120 Z;
                    M0,80 C300,110 600,100 900,110 C1050,115 1150,105 1200,100 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
          </svg>
        );

      case 'smooth':
        return (
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className={cn('w-full h-full', flip && 'scale-y-[-1]')}
          >
            <path
              d="M0,0 C400,100 800,100 1200,0 L1200,120 L0,120 Z"
              className="fill-current"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="10s"
                  repeatCount="indefinite"
                  values="
                    M0,0 C400,100 800,100 1200,0 L1200,120 L0,120 Z;
                    M0,20 C400,80 800,80 1200,20 L1200,120 L0,120 Z;
                    M0,0 C400,100 800,100 1200,0 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
          </svg>
        );

      case 'gradient-mesh':
        return (
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className={cn('w-full h-full', flip && 'scale-y-[-1]')}
          >
            <defs>
              <linearGradient id="mesh-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="text-primary/30" stopColor="currentColor">
                  {animated && (
                    <animate attributeName="stop-opacity" values="0.3;0.6;0.3" dur="8s" repeatCount="indefinite" />
                  )}
                </stop>
                <stop offset="50%" className="text-secondary/20" stopColor="currentColor">
                  {animated && (
                    <animate attributeName="stop-opacity" values="0.2;0.5;0.2" dur="10s" repeatCount="indefinite" />
                  )}
                </stop>
                <stop offset="100%" className="text-accent/25" stopColor="currentColor">
                  {animated && (
                    <animate attributeName="stop-opacity" values="0.25;0.5;0.25" dur="12s" repeatCount="indefinite" />
                  )}
                </stop>
              </linearGradient>
            </defs>
            
            {/* Capa base con gradiente */}
            <path
              d="M0,30 C300,80 600,50 900,70 C1050,80 1150,60 1200,50 L1200,120 L0,120 Z"
              fill="url(#mesh-gradient)"
              opacity="0.6"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="16s"
                  repeatCount="indefinite"
                  values="
                    M0,30 C300,80 600,50 900,70 C1050,80 1150,60 1200,50 L1200,120 L0,120 Z;
                    M0,50 C300,60 600,80 900,50 C1050,60 1150,80 1200,70 L1200,120 L0,120 Z;
                    M0,40 C300,70 600,60 900,80 C1050,70 1150,50 1200,60 L1200,120 L0,120 Z;
                    M0,30 C300,80 600,50 900,70 C1050,80 1150,60 1200,50 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
            
            {/* Capa superior más sutil */}
            <path
              d="M0,60 C300,90 600,70 900,85 C1050,95 1150,80 1200,75 L1200,120 L0,120 Z"
              className="fill-current opacity-40"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="14s"
                  repeatCount="indefinite"
                  values="
                    M0,60 C300,90 600,70 900,85 C1050,95 1150,80 1200,75 L1200,120 L0,120 Z;
                    M0,75 C300,75 600,90 900,70 C1050,80 1150,95 1200,85 L1200,120 L0,120 Z;
                    M0,60 C300,90 600,70 900,85 C1050,95 1150,80 1200,75 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
          </svg>
        );

      case 'fluid':
        return (
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className={cn('w-full h-full', flip && 'scale-y-[-1]')}
          >
            <defs>
              <linearGradient id="fluid-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className="text-primary/20" stopColor="currentColor" />
                <stop offset="50%" className="text-secondary/15" stopColor="currentColor" />
                <stop offset="100%" className="text-primary/20" stopColor="currentColor" />
                {animated && (
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    from="0 0"
                    to="1 0"
                    dur="20s"
                    repeatCount="indefinite"
                  />
                )}
              </linearGradient>
              
              <linearGradient id="fluid-gradient-2" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" className="text-accent/15" stopColor="currentColor" />
                <stop offset="50%" className="text-primary/10" stopColor="currentColor" />
                <stop offset="100%" className="text-accent/15" stopColor="currentColor" />
                {animated && (
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    from="0 0"
                    to="-1 0"
                    dur="25s"
                    repeatCount="indefinite"
                  />
                )}
              </linearGradient>
            </defs>
            
            {/* Capa 1 - Fondo fluido */}
            <path
              d="M0,20 C200,70 400,50 600,65 C800,80 1000,45 1200,55 L1200,120 L0,120 Z"
              fill="url(#fluid-gradient-1)"
              opacity="0.5"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="18s"
                  repeatCount="indefinite"
                  values="
                    M0,20 C200,70 400,50 600,65 C800,80 1000,45 1200,55 L1200,120 L0,120 Z;
                    M0,35 C200,55 400,75 600,50 C800,60 1000,70 1200,45 L1200,120 L0,120 Z;
                    M0,25 C200,65 400,55 600,70 C800,70 1000,50 1200,60 L1200,120 L0,120 Z;
                    M0,20 C200,70 400,50 600,65 C800,80 1000,45 1200,55 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
            
            {/* Capa 2 - Media fluida */}
            <path
              d="M0,45 C200,85 400,70 600,80 C800,95 1000,65 1200,75 L1200,120 L0,120 Z"
              fill="url(#fluid-gradient-2)"
              opacity="0.4"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="22s"
                  repeatCount="indefinite"
                  values="
                    M0,45 C200,85 400,70 600,80 C800,95 1000,65 1200,75 L1200,120 L0,120 Z;
                    M0,60 C200,70 400,90 600,65 C800,75 1000,85 1200,65 L1200,120 L0,120 Z;
                    M0,50 C200,80 400,75 600,85 C800,85 1000,70 1200,80 L1200,120 L0,120 Z;
                    M0,45 C200,85 400,70 600,80 C800,95 1000,65 1200,75 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
            
            {/* Capa 3 - Frente sutil */}
            <path
              d="M0,70 C200,95 400,85 600,92 C800,100 1000,80 1200,88 L1200,120 L0,120 Z"
              className="fill-current opacity-30"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="15s"
                  repeatCount="indefinite"
                  values="
                    M0,70 C200,95 400,85 600,92 C800,100 1000,80 1200,88 L1200,120 L0,120 Z;
                    M0,82 C200,82 400,98 600,80 C800,88 1000,95 1200,82 L1200,120 L0,120 Z;
                    M0,70 C200,95 400,85 600,92 C800,100 1000,80 1200,88 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
          </svg>
        );

      case 'blob':
      default:
        return (
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className={cn('w-full h-full', flip && 'scale-y-[-1]')}
          >
            <path
              d="M0,0 C200,100 400,60 600,80 C800,100 1000,40 1200,60 L1200,120 L0,120 Z"
              className="fill-current"
            >
              {animated && (
                <animate
                  attributeName="d"
                  dur="10s"
                  repeatCount="indefinite"
                  values="
                    M0,0 C200,100 400,60 600,80 C800,100 1000,40 1200,60 L1200,120 L0,120 Z;
                    M0,20 C200,80 400,100 600,60 C800,40 1000,100 1200,80 L1200,120 L0,120 Z;
                    M0,0 C200,100 400,60 600,80 C800,100 1000,40 1200,60 L1200,120 L0,120 Z
                  "
                />
              )}
            </path>
          </svg>
        );
    }
  };

  const getIntensityClasses = () => {
    switch (intensity) {
      case 'subtle':
        return 'opacity-10';
      case 'strong':
        return 'opacity-30';
      case 'medium':
      default:
        return 'opacity-20';
    }
  };

  return (
    <div className={cn('relative w-full h-20 md:h-28 lg:h-36 overflow-hidden', className)}>
      {/* Color de fondo superior con gradiente suave */}
      <div className={cn('absolute inset-0', fromColor)} />
      
      {/* Forma SVG con transición suave */}
      <div className={cn('absolute inset-0 transition-opacity duration-1000', toColor)}>
        {renderShape()}
      </div>
      
      {/* Decoraciones adicionales - orbes flotantes con blur */}
      {animated && (
        <div className={cn('absolute inset-0 overflow-hidden', getIntensityClasses())}>
          {/* Orbe grande izquierda */}
          <div 
            className="absolute top-[15%] left-[8%] w-40 h-40 bg-gradient-to-br from-primary/40 to-secondary/30 rounded-full blur-3xl"
            style={{
              animation: 'float 20s ease-in-out infinite',
              animationDelay: '0s'
            }}
          />
          
          {/* Orbe medio derecha */}
          <div 
            className="absolute top-[45%] right-[12%] w-32 h-32 bg-gradient-to-br from-secondary/35 to-accent/25 rounded-full blur-2xl"
            style={{
              animation: 'float 16s ease-in-out infinite',
              animationDelay: '2s'
            }}
          />
          
          {/* Orbe pequeño centro */}
          <div 
            className="absolute bottom-[25%] left-[55%] w-24 h-24 bg-gradient-to-br from-accent/30 to-primary/20 rounded-full blur-xl"
            style={{
              animation: 'float 18s ease-in-out infinite',
              animationDelay: '4s'
            }}
          />
          
          {/* Orbe extra pequeño */}
          <div 
            className="absolute top-[60%] left-[25%] w-16 h-16 bg-gradient-to-br from-primary/25 to-accent/20 rounded-full blur-lg"
            style={{
              animation: 'float 14s ease-in-out infinite',
              animationDelay: '6s'
            }}
          />
        </div>
      )}
      
      {/* Efecto de brillo sutil en el borde */}
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-50" />
      )}
    </div>
  );
};
