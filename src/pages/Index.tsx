import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Calendar, Shield, Users, CheckCircle2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="flex justify-center">
            <div className="bg-primary p-6 rounded-3xl shadow-2xl">
              <Car className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              RESERVEO
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Te veo y te reservo 😉
            </p>
            <p className="text-base md:text-lg text-muted-foreground/80 max-w-xl mx-auto">
              Sistema inteligente de gestión de aparcamiento corporativo
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Acceder al Sistema
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Crear Cuenta
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Reservas Fáciles</CardTitle>
              <CardDescription>
                Reserva tu plaza de aparcamiento por día completo con un solo clic
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="bg-success/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <CardTitle>Disponibilidad en Tiempo Real</CardTitle>
              <CardDescription>
                Visualiza plazas disponibles con indicadores de color intuitivos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Gestión de Matrículas</CardTitle>
              <CardDescription>
                Registra y gestiona tus vehículos con aprobación administrativa
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="bg-success/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-success" />
              </div>
              <CardTitle>Grupos de Acceso</CardTitle>
              <CardDescription>
                Sistema de roles con acceso diferenciado según privilegios
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Optimiza la Gestión de tu Aparcamiento</CardTitle>
              <CardDescription className="text-lg">
                Diseñado específicamente para empresas modernas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Para Empleados
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Reserva y cancela plazas de forma sencilla</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Visualiza disponibilidad en calendario mensual</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Gestiona múltiples matrículas de vehículos</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Para Administradores
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Control total sobre usuarios y permisos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Aprobación de matrículas y gestión de plazas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Reportes y estadísticas de ocupación</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold">
            ¿Listo para optimizar tu aparcamiento?
          </h2>
          <p className="text-xl text-muted-foreground">
            Únete a empresas que ya confían en RESERVEO
          </p>
          <Button 
            size="lg" 
            className="text-lg px-12"
            onClick={() => navigate("/auth")}
          >
            Comenzar Ahora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground space-y-2">
            <p className="text-sm font-medium">
              © 2025 RESERVEO. Sistema de gestión de aparcamiento corporativo.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Diseñado con guasa por{" "}
              <span className="font-semibold text-primary">Gustoso Studio</span>
            </p>
            <p className="text-xs text-muted-foreground italic mt-1">
              "Diseñamos webs y apps que tu cuñado querrá copiar"
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
