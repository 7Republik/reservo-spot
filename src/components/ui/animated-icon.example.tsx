import { AnimatedIcon } from "./animated-icon"
import { 
  MapPin, 
  AlertCircle, 
  Check, 
  Calendar,
  Zap,
  Loader2
} from "lucide-react"

/**
 * Ejemplos de uso del componente AnimatedIcon
 * 
 * Este componente proporciona animaciones optimizadas para iconos con:
 * - Lazy loading con IntersectionObserver
 * - Respeto a prefers-reduced-motion
 * - Animaciones simplificadas en móvil
 * - Duración y delay personalizables
 */

export function AnimatedIconExamples() {
  return (
    <div className="space-y-12 p-8">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Animación: Pulse</h2>
        <p className="text-muted-foreground">
          Ideal para iconos de ubicación o elementos que requieren atención constante
        </p>
        <div className="flex gap-8 items-center">
          <div className="space-y-2">
            <p className="text-sm font-medium">Pulse Sutil (Móvil)</p>
            <AnimatedIcon
              icon={<MapPin />}
              animation="pulse"
              size="lg"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Con Lazy Loading</p>
            <AnimatedIcon
              icon={<MapPin className="text-primary" />}
              animation="pulse"
              size="xl"
              lazy
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Animación: Bounce</h2>
        <p className="text-muted-foreground">
          Perfecto para alertas o botones de acción (solo en hover en desktop)
        </p>
        <div className="flex gap-8 items-center">
          <div className="space-y-2">
            <p className="text-sm font-medium">Bounce en Hover</p>
            <AnimatedIcon
              icon={<AlertCircle className="text-warning" />}
              animation="bounce"
              size="lg"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Con Delay</p>
            <AnimatedIcon
              icon={<AlertCircle className="text-error" />}
              animation="bounce"
              size="xl"
              delay={200}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Animación: Draw</h2>
        <p className="text-muted-foreground">
          Animación de dibujo para checkmarks (requiere SVG path)
        </p>
        <div className="flex gap-8 items-center">
          <div className="space-y-2">
            <p className="text-sm font-medium">Checkmark Draw</p>
            <AnimatedIcon
              icon={<Check className="text-success" />}
              animation="draw"
              size="lg"
              duration={400}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Draw Lento</p>
            <AnimatedIcon
              icon={<Check className="text-success" />}
              animation="draw"
              size="xl"
              duration={800}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Animación: Float</h2>
        <p className="text-muted-foreground">
          Flotación suave, ideal para iconos decorativos
        </p>
        <div className="flex gap-8 items-center">
          <div className="space-y-2">
            <p className="text-sm font-medium">Float Suave</p>
            <AnimatedIcon
              icon={<Calendar className="text-primary" />}
              animation="float"
              size="lg"
              duration={3000}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Float Rápido</p>
            <AnimatedIcon
              icon={<Zap className="text-warning" />}
              animation="float"
              size="xl"
              duration={1500}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Animaciones Nativas</h2>
        <p className="text-muted-foreground">
          Spin y Ping para estados de carga
        </p>
        <div className="flex gap-8 items-center">
          <div className="space-y-2">
            <p className="text-sm font-medium">Spin (Loading)</p>
            <AnimatedIcon
              icon={<Loader2 />}
              animation="spin"
              size="lg"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Ping (Notification)</p>
            <AnimatedIcon
              icon={<div className="w-3 h-3 bg-success rounded-full" />}
              animation="ping"
              size="sm"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Sin Animación</h2>
        <p className="text-muted-foreground">
          Iconos estáticos con tamaños consistentes
        </p>
        <div className="flex gap-8 items-center">
          <AnimatedIcon icon={<MapPin />} size="sm" />
          <AnimatedIcon icon={<MapPin />} size="md" />
          <AnimatedIcon icon={<MapPin />} size="lg" />
          <AnimatedIcon icon={<MapPin />} size="xl" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Uso en Contexto</h2>
        <p className="text-muted-foreground">
          Ejemplos de uso real en la aplicación
        </p>
        
        {/* Ejemplo: Header con fecha */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AnimatedIcon
              icon={<Calendar className="text-primary" />}
              animation="float"
              size="lg"
            />
            <div>
              <h3 className="text-xl font-semibold">Viernes, 15 de Noviembre</h3>
              <p className="text-sm text-muted-foreground">Hoy</p>
            </div>
          </div>
        </div>

        {/* Ejemplo: Ubicación con pulse */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AnimatedIcon
              icon={<MapPin className="text-primary" />}
              animation="pulse"
              size="md"
            />
            <span className="text-sm font-medium">Planta -1, Zona Norte</span>
          </div>
        </div>

        {/* Ejemplo: Alerta con bounce */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AnimatedIcon
              icon={<AlertCircle className="text-warning" />}
              animation="bounce"
              size="lg"
            />
            <div>
              <h4 className="font-semibold">Reportar Incidencia</h4>
              <p className="text-sm text-muted-foreground">
                ¿Hay algún problema con tu plaza?
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 bg-muted/50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold">Notas de Implementación</h2>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>
            <strong>Lazy Loading:</strong> Usa <code>lazy={"{true}"}</code> para activar animaciones solo cuando el icono es visible
          </li>
          <li>
            <strong>Reduced Motion:</strong> El componente respeta automáticamente <code>prefers-reduced-motion</code>
          </li>
          <li>
            <strong>Mobile-First:</strong> Animaciones simplificadas en móvil para mejor performance
          </li>
          <li>
            <strong>Duración:</strong> Personaliza con <code>duration</code> en milisegundos (default: 2000ms)
          </li>
          <li>
            <strong>Delay:</strong> Añade <code>delay</code> para animaciones escalonadas
          </li>
          <li>
            <strong>Accesibilidad:</strong> Todos los iconos tienen <code>aria-hidden="true"</code> por defecto
          </li>
        </ul>
      </section>
    </div>
  )
}
