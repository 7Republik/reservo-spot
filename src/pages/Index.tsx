import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Calendar, Shield, Users, CheckCircle2, ArrowRight, Sparkles, Zap, Lock } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section - Modern & Bold */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        
        {/* Floating elements decoration */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Sistema #1 en Gestión Inteligente</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-fade-in">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Gestión de
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                Aparcamiento
              </span>
              <br />
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Revolucionaria
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto font-light animate-fade-in">
              Automatiza, optimiza y controla tu parking corporativo con IA.
              <span className="block mt-2 text-primary font-medium">Sin complicaciones. 100% digital.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-fade-in">
              <Button size="lg" className="text-lg px-10 py-7 rounded-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-2xl hover:shadow-primary/50 transition-all hover:scale-105 group" onClick={() => navigate("/auth")}>
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-full border-2 hover:bg-primary/5 hover:border-primary transition-all hover:scale-105" onClick={() => navigate("/auth")}>
                Ver Demo
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 pt-12 text-sm text-muted-foreground animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Configuración en 2 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Card Style Modern */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Características Potentes</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Todo lo que necesitas,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="group border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="bg-gradient-to-br from-primary to-primary-glow w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                  <Calendar className="h-7 w-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Reservas Instantáneas</CardTitle>
                <CardDescription className="text-base">
                  Reserva tu plaza en segundos desde cualquier dispositivo. Sistema inteligente de disponibilidad en tiempo real.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="bg-gradient-to-br from-accent to-success w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-accent/20">
                  <CheckCircle2 className="h-7 w-7 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl">Visibilidad Total</CardTitle>
                <CardDescription className="text-base">
                  Dashboard completo con estadísticas, ocupación en vivo y predicciones inteligentes de disponibilidad.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="bg-gradient-to-br from-primary to-primary-glow w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Control Total</CardTitle>
                <CardDescription className="text-base">
                  Gestión de matrículas, permisos y accesos con aprobación automatizada y verificación instantánea.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="bg-gradient-to-br from-accent to-success w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-accent/20">
                  <Users className="h-7 w-7 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl">Multi-Usuario</CardTitle>
                <CardDescription className="text-base">
                  Roles y permisos personalizables. Gestiona equipos completos con acceso diferenciado y seguro.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section - Split Layout */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left side - Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">100% Seguro y Confiable</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Diseñado para{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  empresas modernas
                </span>
              </h2>

              <p className="text-xl text-muted-foreground">
                No más hojas de Excel, llamadas telefónicas o confusión. ParkingManager centraliza todo en una plataforma intuitiva y poderosa.
              </p>

              {/* Feature list */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/5 border border-accent/10 hover:bg-accent/10 transition-colors">
                  <div className="bg-accent/20 p-2 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Automatización Inteligente</h3>
                    <p className="text-muted-foreground">Reglas automáticas, notificaciones y recordatorios que funcionan por ti</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Analytics Avanzados</h3>
                    <p className="text-muted-foreground">Reportes detallados, métricas de ocupación y optimización de espacios</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/5 border border-accent/10 hover:bg-accent/10 transition-colors">
                  <div className="bg-accent/20 p-2 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Integración Perfecta</h3>
                    <p className="text-muted-foreground">Se adapta a tu infraestructura actual sin complicaciones técnicas</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="text-lg px-8 py-6 rounded-full group" onClick={() => navigate("/auth")}>
                Prueba Gratuita
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Right side - Stats Cards */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-8 text-center border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all">
                <div className="text-5xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime garantizado</div>
              </Card>
              <Card className="p-8 text-center border-border/50 bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-xl transition-all">
                <div className="text-5xl font-bold text-accent mb-2">24/7</div>
                <div className="text-muted-foreground">Soporte disponible</div>
              </Card>
              <Card className="p-8 text-center border-border/50 bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-xl transition-all">
                <div className="text-5xl font-bold text-accent mb-2">&lt;2min</div>
                <div className="text-muted-foreground">Setup inicial</div>
              </Card>
              <Card className="p-8 text-center border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all">
                <div className="text-5xl font-bold text-primary mb-2">100%</div>
                <div className="text-muted-foreground">Cloud seguro</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Bold & Direct */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-accent opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Únete a las empresas
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                que ya optimizaron
              </span>
              <br />
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                su aparcamiento
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Empieza hoy mismo. Sin contratos. Sin tarjeta de crédito. Sin complicaciones.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" className="text-xl px-12 py-8 rounded-full bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/50 transition-all hover:scale-105 group" onClick={() => navigate("/auth")}>
                Comenzar Ahora
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center items-center gap-8 pt-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm">Certificado ISO 27001</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-5 w-5 text-primary" />
                <span className="text-sm">Encriptación SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal & Clean */}
      <footer className="relative border-t border-border/50 py-12 px-4 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-lg">Reserveo</div>
                <div className="text-sm text-muted-foreground">by 7Republik</div>
              </div>
            </div>
            
            <div className="text-center md:text-right text-muted-foreground">
              <p className="text-sm">
                © 2024 ParkingManager. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;