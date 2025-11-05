import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, Car, LogOut, Settings, ParkingSquare, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          // Defer role checking
          setTimeout(() => {
            checkUserRole(session.user.id);
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
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
        const userRoles = roles.map(r => r.role);
        const highestRole = roleOrder.find(role => userRoles.includes(role)) || "general";
        setUserRole(highestRole);
      }
    } catch (error: any) {
      console.error("Error checking user role:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sesión cerrada correctamente");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Error al cerrar sesión");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ParkingManager</h1>
                <p className="text-sm text-muted-foreground">Gestión de Aparcamiento</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user.email}</p>
                <Badge variant="secondary" className="text-xs">
                  {userRole === "admin" ? "Administrador" : 
                   userRole === "director" ? "Director" :
                   userRole === "preferred" ? "Preferente" : "General"}
                </Badge>
              </div>
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={isAdmin ? "admin" : "calendar"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="licenses" className="gap-2">
              <ParkingSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Matrículas</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Administración</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Reservar Plaza de Aparcamiento
                </CardTitle>
                <CardDescription>
                  Selecciona un día para reservar tu plaza de aparcamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParkingCalendar userId={user.id} userRole={userRole} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="licenses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ParkingSquare className="h-5 w-5" />
                  Gestión de Matrículas
                </CardTitle>
                <CardDescription>
                  Añade y gestiona tus matrículas de vehículos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LicensePlateManager userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
