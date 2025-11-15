import { GradientButton } from "./gradient-button"
import { Check, MapPin, AlertCircle, ArrowRight } from "lucide-react"

/**
 * Ejemplos de uso del componente GradientButton
 * 
 * Este archivo demuestra las diferentes variantes, tamaños y estados
 * del componente GradientButton según el diseño especificado.
 */

export function GradientButtonExamples() {
  return (
    <div className="space-y-12 p-8">
      {/* Variantes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Variantes</h2>
        
        <div className="flex flex-wrap gap-4">
          <GradientButton variant="primary">
            Primary Button
          </GradientButton>
          
          <GradientButton variant="secondary">
            Secondary Button
          </GradientButton>
          
          <GradientButton variant="outline">
            Outline Button
          </GradientButton>
        </div>
      </section>

      {/* Tamaños */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tamaños</h2>
        
        <div className="flex flex-wrap items-center gap-4">
          <GradientButton size="sm">
            Small
          </GradientButton>
          
          <GradientButton size="md">
            Medium (Default)
          </GradientButton>
          
          <GradientButton size="lg">
            Large
          </GradientButton>
        </div>
      </section>

      {/* Con iconos */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Con Iconos</h2>
        
        <div className="flex flex-wrap gap-4">
          <GradientButton icon={<Check />} iconPosition="left">
            Hacer Check-in
          </GradientButton>
          
          <GradientButton 
            variant="secondary" 
            icon={<MapPin />} 
            iconPosition="left"
          >
            Ver Ubicación
          </GradientButton>
          
          <GradientButton 
            variant="outline" 
            icon={<AlertCircle />} 
            iconPosition="left"
          >
            Reportar Incidencia
          </GradientButton>
          
          <GradientButton 
            icon={<ArrowRight />} 
            iconPosition="right"
          >
            Continuar
          </GradientButton>
        </div>
      </section>

      {/* Estados */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Estados</h2>
        
        <div className="flex flex-wrap gap-4">
          <GradientButton loading>
            Guardando...
          </GradientButton>
          
          <GradientButton disabled>
            Deshabilitado
          </GradientButton>
          
          <GradientButton variant="outline" loading>
            Cargando...
          </GradientButton>
        </div>
      </section>

      {/* Casos de uso reales */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Casos de Uso - RESERVEO</h2>
        
        <div className="space-y-6">
          {/* Check-in Card */}
          <div className="bg-card p-6 rounded-lg border space-y-4">
            <h3 className="font-semibold">Check-in de Hoy</h3>
            <p className="text-sm text-muted-foreground">
              Tienes una reserva activa para hoy
            </p>
            <GradientButton 
              variant="primary" 
              icon={<Check />}
              className="w-full md:w-auto"
            >
              Hacer Check-in
            </GradientButton>
          </div>

          {/* Reservation Card Actions */}
          <div className="bg-card p-6 rounded-lg border space-y-4">
            <h3 className="font-semibold">Plaza AV-21</h3>
            <p className="text-sm text-muted-foreground">
              Planta -1, Zona Norte
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <GradientButton 
                variant="outline"
                icon={<AlertCircle />}
                className="flex-1"
              >
                Reportar Incidencia
              </GradientButton>
              <GradientButton 
                variant="secondary"
                icon={<MapPin />}
                className="flex-1"
              >
                Ver Ubicación
              </GradientButton>
            </div>
          </div>

          {/* Loading state */}
          <div className="bg-card p-6 rounded-lg border space-y-4">
            <h3 className="font-semibold">Procesando Reserva</h3>
            <GradientButton loading className="w-full md:w-auto">
              Reservando plaza...
            </GradientButton>
          </div>
        </div>
      </section>

      {/* Responsive */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Responsive (Mobile-First)</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            En móvil, los botones se expanden al 100% del ancho.
            En desktop, tienen ancho automático.
          </p>
          
          <GradientButton className="w-full md:w-auto">
            Botón Responsive
          </GradientButton>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <GradientButton variant="outline" className="flex-1">
              Opción 1
            </GradientButton>
            <GradientButton variant="secondary" className="flex-1">
              Opción 2
            </GradientButton>
          </div>
        </div>
      </section>

      {/* Accesibilidad */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Accesibilidad</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            ✅ Min-height 44px (WCAG touch targets)<br />
            ✅ Focus ring visible<br />
            ✅ Loading state con aria-label<br />
            ✅ Disabled state con cursor not-allowed<br />
            ✅ Touch feedback (scale 0.96 en active)
          </p>
          
          <GradientButton>
            Prueba el focus con Tab ⌨️
          </GradientButton>
        </div>
      </section>
    </div>
  )
}
