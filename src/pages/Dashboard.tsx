import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoReserveo from "@/assets/logo-reserveo.png";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, LogOut, Settings, ParkingSquare, Loader2 } from "lucide-react";
import ParkingCalendar from "@/components/ParkingCalendar";
import LicensePlateManager from "@/components/LicensePlateManager";
import AdminPanel from "@/components/AdminPanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("general");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isDeactivated, setIsDeactivated] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          // Navegamos con un pequeño retraso para evitar abortar llamadas en curso (p.ej. logout global)
          setTimeout(() => {
            navigate("/auth");
          }, 500);
        } else {
          // Defer role checking
          setTimeout(() => {
            checkUserRole(session.user.id);
            checkUserStatus(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        checkUserRole(session.user.id);
        checkUserStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  /**
   * Obtiene y establece el rol del usuario actual desde Supabase.
   * @param userId ID del usuario autenticado
   */
  const checkUserRole = async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      if (roles && roles.length > 0) {
        const hasAdminRole = roles.some(r => r.role === "admin");
        setIsAdmin(hasAdminRole);
        
        // Get highest priority role
        const roleOrder = ["admin", "director", "preferred", "visitor", "general"];
        const userRoles = roles.map(r => r.role as string);
        const highestRole = roleOrder.find(role => userRoles.includes(role)) || "general";
        setUserRole(highestRole);
      }
    } catch (error: any) {
      console.error("Error checking user role:", error);
    }
  };

  /**
   * Verifica el estado del usuario (bloqueado/desactivado)
   * @param userId ID del usuario autenticado
   */
  const checkUserStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_blocked, blocked_reason, is_deactivated")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (profile) {
        setIsBlocked(profile.is_blocked || false);
        setBlockReason(profile.blocked_reason || "");
        setIsDeactivated(profile.is_deactivated || false);
      }
    } catch (error: any) {
      console.error("Error checking user status:", error);
    }
  };

  /**
   * Pausa asíncrona.
   */
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Cierra sesión con intentos de reintento si hay errores de red/Abort.
   * Si el cierre global falla persistentemente por red, aplica fallback local.
   * @param maxRetries Número máximo de reintentos para el cierre global
   * @returns "global" si cerró con alcance global, "local" si se aplicó fallback
   */
  const signOutWithRetry = async (maxRetries = 2): Promise<"global" | "local"> => {
    let attempt = 0;
    while (attempt <= maxRetries) {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (!error) {
        return "global";
      }

      const message = (typeof error?.message === "string" ? error.message : "").toLowerCase();
      const isAbortOrNetwork = message.includes("abort") || message.includes("network") || error?.name === "AbortError";

      // Si no es error de red/Abort, no reintentamos
      if (!isAbortOrNetwork) {
        throw error;
      }

      attempt += 1;
      if (attempt <= maxRetries) {
        // Backoff simple: 200ms, 400ms, ...
        await sleep(200 * attempt);
      }
    }

    // Fallback local si persisten problemas de red
    const { error: localError } = await supabase.auth.signOut({ scope: "local" });
    if (localError) {
      throw localError;
    }
    return "local";
  };

  /**
   * Cierra la sesión del usuario manejando errores de red.
   * Evita navegar manualmente para no abortar la petición; la redirección
   * se realiza desde el listener de `onAuthStateChange` cuando la sesión es nula.
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await signOutWithRetry(2);
      if (result === "global") {
        toast.success("Sesión cerrada correctamente");
      } else {
        toast.success("Sesión cerrada localmente. Si el problema persiste, vuelve a intentar.");
      }
      // No navegamos aquí; `onAuthStateChange` redirige a /auth al quedar sin sesión.
    } catch (err: any) {
      const message = (typeof err?.message === "string" ? err.message : "")?.toLowerCase();
      const isNetwork = message.includes("network") || message.includes("abort") || err?.name === "AbortError";
      if (isNetwork) {
        toast.error("Problema de red al cerrar sesión. Revisa tu conexión e inténtalo de nuevo.");
      } else {
        toast.error("No hemos podido cerrar tu sesión. Intenta de nuevo.");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              🚫 Cuenta Bloqueada
            </CardTitle>
            <CardDescription>
              Tu cuenta ha sido bloqueada por un administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 p-4 rounded-md border border-destructive">
              <p className="text-sm font-semibold mb-2">Motivo del bloqueo:</p>
              <p className="text-sm text-muted-foreground">{blockReason}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Por favor, contacta con el administrador de la empresa para resolver esta situación.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDeactivated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-orange-500 flex items-center gap-2">
              ⚠️ Cuenta Desactivada
            </CardTitle>
            <CardDescription>
              Tu cuenta ha sido dada de baja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tu cuenta ha sido desactivada. Por favor, contacta con el administrador de la empresa si crees que esto es un error.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg">
                <img 
                  src={logoReserveo} 
                  alt="Logo RESERVEO" 
                  className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-foreground">RESERVEO</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Te veo y te reservo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user.email}</p>
                <Badge variant="secondary" className="text-xs">
                  {userRole === "admin" ? "Administrador" : 
                   userRole === "director" ? "Director" :
                   userRole === "preferred" ? "Preferente" : "General"}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-busy={isLoggingOut}
                aria-label="Cerrar sesión"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue={isAdmin ? "admin" : "calendar"} className="space-y-3 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="calendar" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="licenses" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <ParkingSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Matrículas</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="calendar" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            <Card>
              <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Reservar Plaza de Aparcamiento
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Selecciona un día para reservar tu plaza de aparcamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
                <ParkingCalendar userId={user.id} userRole={userRole} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="licenses" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            <Card>
              <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <ParkingSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  Gestión de Matrículas
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Añade y gestiona tus matrículas de vehículos
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
                <LicensePlateManager userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
