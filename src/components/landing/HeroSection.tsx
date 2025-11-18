import { motion } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// ============================================
// NOISE COMPONENT
// ============================================

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
  intensity?: number;
}

function Noise({
  patternSize = 100,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 1,
  patternAlpha = 50,
  intensity = 1,
}: NoiseProps) {
  const grainRef = useRef<HTMLCanvasElement>(null);
  const canvasCssSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;

    const patternCtx = patternCanvas.getContext("2d");
    if (!patternCtx) return;

    const patternData = patternCtx.createImageData(patternSize, patternSize);
    const patternPixelDataLength = patternSize * patternSize * 4;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      let newCssWidth = window.innerWidth;
      let newCssHeight = window.innerHeight;

      if (canvas.parentElement) {
        const parentRect = canvas.parentElement.getBoundingClientRect();
        newCssWidth = parentRect.width;
        newCssHeight = parentRect.height;
      }

      canvasCssSizeRef.current = { width: newCssWidth, height: newCssHeight };

      canvas.width = newCssWidth * dpr;
      canvas.height = newCssHeight * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updatePattern = () => {
      for (let i = 0; i < patternPixelDataLength; i += 4) {
        const value = Math.random() * 255 * intensity;
        patternData.data[i] = value;
        patternData.data[i + 1] = value;
        patternData.data[i + 2] = value;
        patternData.data[i + 3] = patternAlpha;
      }
      patternCtx.putImageData(patternData, 0, 0);
    };

    const drawGrain = () => {
      const { width: cssWidth, height: cssHeight } = canvasCssSizeRef.current;
      if (cssWidth === 0 || cssHeight === 0) return;

      ctx.clearRect(0, 0, cssWidth, cssHeight);

      ctx.save();

      const safePatternScaleX = Math.max(0.001, patternScaleX);
      const safePatternScaleY = Math.max(0.001, patternScaleY);
      ctx.scale(safePatternScaleX, safePatternScaleY);

      const fillPattern = ctx.createPattern(patternCanvas, "repeat");
      if (fillPattern) {
        ctx.fillStyle = fillPattern;
        ctx.fillRect(
          0,
          0,
          cssWidth / safePatternScaleX,
          cssHeight / safePatternScaleY
        );
      }

      ctx.restore();
    };

    let animationFrameId: number;
    const loop = () => {
      if (
        canvasCssSizeRef.current.width > 0 &&
        canvasCssSizeRef.current.height > 0
      ) {
        if (frame % patternRefreshInterval === 0) {
          updatePattern();
          drawGrain();
        }
      }
      frame++;
      animationFrameId = window.requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);
    resize();
    if (patternRefreshInterval > 0) {
      loop();
    } else {
      updatePattern();
      drawGrain();
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    patternSize,
    patternScaleX,
    patternScaleY,
    patternRefreshInterval,
    patternAlpha,
    intensity,
  ]);

  return (
    <canvas
      className="absolute inset-0 w-full h-full pointer-events-none"
      ref={grainRef}
    />
  );
}

// ============================================
// GRADIENT BACKGROUND COMPONENT
// ============================================

interface GradientBackgroundProps {
  gradientType?: string;
  gradientSize?: string;
  gradientOrigin?: string;
  colors?: Array<{ color: string; stop: string }>;
  enableNoise?: boolean;
  noisePatternSize?: number;
  noisePatternScaleX?: number;
  noisePatternScaleY?: number;
  noisePatternRefreshInterval?: number;
  noisePatternAlpha?: number;
  noiseIntensity?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  customGradient?: string | null;
}

function GradientBackground({
  gradientType = "radial-gradient",
  gradientSize = "125% 125%",
  gradientOrigin = "bottom-middle",
  colors = [
    { color: "rgba(99,102,241,1)", stop: "0%" },
    { color: "rgba(139,92,246,1)", stop: "25%" },
    { color: "rgba(168,85,247,1)", stop: "50%" },
    { color: "rgba(217,70,239,1)", stop: "75%" },
    { color: "rgba(236,72,153,1)", stop: "100%" },
  ],
  enableNoise = true,
  noisePatternSize = 100,
  noisePatternScaleX = 1,
  noisePatternScaleY = 1,
  noisePatternRefreshInterval = 1,
  noisePatternAlpha = 50,
  noiseIntensity = 1,
  className = "",
  style = {},
  children,
  customGradient = null,
}: GradientBackgroundProps) {
  const generateGradient = () => {
    if (customGradient) return customGradient;

    const getGradientPosition = (origin: string) => {
      const positions: Record<string, string> = {
        "bottom-middle": "50% 101%",
        "bottom-left": "0% 101%",
        "bottom-right": "100% 101%",
        "top-middle": "50% -1%",
        "top-left": "0% -1%",
        "top-right": "100% -1%",
        "left-middle": "-1% 50%",
        "right-middle": "101% 50%",
        center: "50% 50%",
      };
      return positions[origin] || positions["bottom-middle"];
    };

    const position = getGradientPosition(gradientOrigin);
    const colorStops = colors
      .map(({ color, stop }) => `${color} ${stop}`)
      .join(",");

    if (gradientType === "radial-gradient") {
      return `radial-gradient(${gradientSize} at ${position},${colorStops})`;
    }

    return `${gradientType}(${colorStops})`;
  };

  const gradientStyle = {
    background: generateGradient(),
    ...style,
  };

  return (
    <div
      className={cn("absolute inset-0 w-full h-full", className)}
      style={gradientStyle}
    >
      {enableNoise && (
        <Noise
          patternSize={noisePatternSize}
          patternScaleX={noisePatternScaleX}
          patternScaleY={noisePatternScaleY}
          patternRefreshInterval={noisePatternRefreshInterval}
          patternAlpha={noisePatternAlpha}
          intensity={noiseIntensity}
        />
      )}
      {children}
    </div>
  );
}

// ============================================
// ELEGANT SHAPE COMPONENT
// ============================================

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// HERO SECTION PROPS INTERFACE
// ============================================

export interface HeroSectionProps {
  headline: string;
  subheadline: string;
  primaryCTA: { text: string; onClick: () => void };
  secondaryCTA: { text: string; onClick: () => void };
  microclaim: string;
  imageUrl?: string;
}

// ============================================
// HERO SECTION COMPONENT
// ============================================

export const HeroSection = ({
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
  microclaim,
  imageUrl,
}: HeroSectionProps) => {
  const navigate = useNavigate();

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  } as const;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-900 pt-20 md:pt-24">
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/video_hero_reserveo.mp4" type="video/mp4" />
      </video>

      {/* Overlay oscuro para legibilidad del contenido */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/80" />
      
      {/* Overlay adicional con gradiente azul sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-indigo-900/20" />

      <div className="relative z-10 container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="max-w-5xl mx-auto text-center">
          {/* Microclaim Badge */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/[0.15] backdrop-blur-sm mb-8 md:mb-12"
          >
            <div className="relative">
              <Sparkles className="h-4 w-4 text-blue-300" />
              <div className="absolute inset-0 blur-md">
                <Sparkles className="h-4 w-4 text-blue-300" />
              </div>
            </div>
            <span className="text-sm text-white/80 tracking-wide font-medium">
              {microclaim}
            </span>
          </motion.div>

          {/* Logo + Nombre RESERVEO */}
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-6 md:mb-8"
          >
            <div className="flex items-center justify-center gap-4 md:gap-6 mb-4">
              {/* Logo con glassmorphism y rayas de parking */}
              <div className="relative">
                {/* Glow múltiple para fundirlo con el fondo */}
                <div className="absolute inset-0 bg-blue-400/30 blur-3xl rounded-3xl scale-150" />
                <div className="absolute inset-0 bg-sky-300/20 blur-2xl rounded-3xl scale-125" />
                
                {/* Contenedor glassmorphism con rayas de parking */}
                <div className="relative p-3 md:p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-[0_8px_32px_0_rgba(147,197,253,0.15)] overflow-hidden">
                  {/* Patrón de rayas diagonales estilo parking - blanco y naranja teja */}
                  <div 
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        -45deg,
                        rgba(255, 255, 255, 0.4) 0px,
                        rgba(255, 255, 255, 0.4) 8px,
                        rgba(234, 88, 12, 0.5) 8px,
                        rgba(234, 88, 12, 0.5) 16px
                      )`
                    }}
                  />
                  
                  {/* Logo */}
                  <img
                    src="/logo_reserveo.png"
                    alt="RESERVEO Logo"
                    className="relative h-12 md:h-16 lg:h-20 w-auto opacity-90 z-10"
                    style={{
                      filter: 'drop-shadow(0 0 15px rgba(147,197,253,0.3))'
                    }}
                  />
                </div>
              </div>
              
              {/* Nombre RESERVEO con glow suave */}
              <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter relative">
                {/* Glow detrás del texto */}
                <span 
                  className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-sky-200 to-indigo-200 blur-xl opacity-60"
                  aria-hidden="true"
                >
                  RESERVEO
                </span>
                {/* Texto principal con sombra suave */}
                <span 
                  className="relative block bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-sky-100 to-indigo-100 leading-none"
                  style={{
                    filter: 'drop-shadow(0 0 30px rgba(147,197,253,0.5)) drop-shadow(0 0 60px rgba(59,130,246,0.3))',
                    textShadow: '0 0 40px rgba(147,197,253,0.4), 0 0 80px rgba(59,130,246,0.2)'
                  }}
                >
                  RESERVEO
                </span>
              </h1>
            </div>
            
            {/* Slogan más pequeño con glow sutil */}
            <p 
              className="text-lg md:text-xl lg:text-2xl text-blue-100/80 font-light tracking-wide"
              style={{
                textShadow: '0 0 20px rgba(147,197,253,0.3), 0 0 40px rgba(59,130,246,0.2)'
              }}
            >
              Te veo y Te reservo
            </p>
          </motion.div>

          {/* Headline pregunta */}
          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-semibold text-white/90 mb-4 px-4">
              {headline}
            </h2>
          </motion.div>

          {/* Subheadline */}
          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-sm xs:text-base sm:text-lg md:text-xl text-white/60 mb-8 sm:mb-10 leading-relaxed font-light tracking-wide max-w-2xl mx-auto px-4">
              {subheadline}
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4 max-w-md sm:max-w-none mx-auto"
          >
            {/* Primary CTA */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                <Button
                  size="lg"
                  onClick={primaryCTA.onClick}
                  className="relative w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-lg border-0"
                >
                  {primaryCTA.text}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </motion.div>

            {/* Secondary CTA */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                variant="outline"
                onClick={secondaryCTA.onClick}
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold bg-white/[0.08] hover:bg-white/[0.15] text-white border-2 border-white/[0.2] hover:border-white/[0.3] rounded-full backdrop-blur-sm"
              >
                {secondaryCTA.text}
              </Button>
            </motion.div>
          </motion.div>

          {/* Features List */}
          <motion.div
            custom={5}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col xs:flex-row flex-wrap items-center justify-center gap-3 xs:gap-4 sm:gap-6 text-xs xs:text-sm text-white/50 px-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-400 flex-shrink-0" />
              <span className="whitespace-nowrap">Sin conflictos garantizado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-400 flex-shrink-0" />
              <span className="whitespace-nowrap">100% trazable</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-400 flex-shrink-0" />
              <span className="whitespace-nowrap">Implementación rápida</span>
            </div>
          </motion.div>

          {/* Dashboard Screenshot (opcional) */}
          {imageUrl && (
            <motion.div
              custom={6}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="mt-16 hidden md:block"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/[0.1] backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20" />
                <img
                  src={imageUrl}
                  alt="Dashboard de RESERVEO - Sistema de gestión de aparcamiento corporativo con calendario de reservas, mapa interactivo de plazas y estadísticas en tiempo real"
                  className="relative w-full h-auto"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Gradiente suave de transición inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50 pointer-events-none z-20" />
    </div>
  );
};
