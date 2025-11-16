import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  AlertTriangle, 
  BarChart3, 
  ArrowLeft, 
  LogOut,
  Loader2,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { clearVisualEditorSession } from "@/lib/visualEditorStorage";
import logoReserveo from "@/assets/logo-reserveo.png";

// Import profile components
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";
import { WarningsList } from "@/components/profile/WarningsList";
import UserStats from "@/components/profile/UserStats";
import WarningCounter from "@/components/profile/WarningCounter";
import { ActiveBlocksCard } from "@/components/profile/ActiveBlocksCard";

// Import hooks
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserWarnings } from "@/hooks/useUserWarnings";
import { useUserStats } from "@/hooks/useUserStats";
import { useUserBlocks } from "@/hooks/useUserBlocks";

type ProfileTab = "personal" | "warnings" | "stats";

/**
 * Profile page component
 * 
 * Main user profile page with tabs for:
 * - Personal Data: Edit profile information
 * - Warnings: View warning history
 * - Statistics: View usage statistics
 * 
 * Features:
 * - Tab navigation via query parameters
 * - Responsive layout (stack on mobile, side-by-side on desktop)
 * - Breadcrumb navigation
 * - Warning counter in header
 */
const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Get current tab from URL or default to "personal"
  const currentTab = (searchParams.get("tab") as ProfileTab) || "personal";

  // Redirect to /profile?tab=personal if no tab is specified
  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "personal" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Hooks
  const { profile, isLoading: profileLoading, updateProfile, updateNotificationPreferences } = useUserProfile();
  const { warnings, unviewedCount, isLoading: warningsLoading } = useUserWarnings({
    markAsViewed: currentTab === "warnings"
  });
  const { stats } = useUserStats();
  const { blocks, infractionCounts, isLoading: blocksLoading } = useUserBlocks();

  // Get user session
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email || "");
    };
    getUser();
  }, [navigate]);

  // Update user name when profile loads
  useEffect(() => {
    if (profile) {
      setUserName(profile.full_name || userEmail.split("@")[0]);
    }
  }, [profile, userEmail]);

  // Handle tab change
  const handleTabChange = (tab: ProfileTab) => {
    setSearchParams({ tab });
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear Visual Editor session state
      clearVisualEditorSession();
      
      toast.success("Sesión cerrada correctamente");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Error al cerrar sesión");
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Loading state
  if (!userId || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Te veo y te reservo
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{userEmail}</p>
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
        {/* Breadcrumb */}
        <nav className="mb-4 sm:mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="h-8 px-2 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </li>
            <ChevronRight className="h-4 w-4" />
            <li className="text-foreground font-medium">Mi Perfil</li>
          </ol>
        </nav>

        {/* Profile Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <User className="h-6 w-6 sm:h-8 sm:w-8" />
                {userName}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Gestiona tu información personal y revisa tu historial
              </p>
            </div>
            
            {/* Warning Counter */}
            <div className="flex-shrink-0">
              <WarningCounter 
                count={stats?.total_warnings || 0} 
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger 
              value="personal" 
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Datos Personales</span>
              <span className="xs:hidden">Datos</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="warnings" 
              className="gap-1 sm:gap-2 text-xs sm:text-sm relative"
            >
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Amonestaciones</span>
              <span className="xs:hidden">Avisos</span>
              {unviewedCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-1 h-5 min-w-[20px] px-1 text-xs"
                >
                  {unviewedCount}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="stats" 
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Estadísticas</span>
              <span className="xs:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Data Tab */}
          <TabsContent value="personal" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Profile Editor */}
            {profile && (
              <ProfileEditor
                profile={profile}
                onUpdate={updateProfile}
                isLoading={profileLoading}
              />
            )}

            {/* Notification Preferences */}
            <NotificationPreferences />

            {/* Active Blocks Section */}
            <ActiveBlocksCard
              blocks={blocks}
              infractionCounts={infractionCounts}
              isLoading={blocksLoading}
              onWarningClick={(warningId) => {
                // Navigate to warnings tab and highlight the warning
                setSearchParams({ tab: "warnings" });
                console.log("Navigate to warning:", warningId);
              }}
            />
          </TabsContent>

          {/* Warnings Tab */}
          <TabsContent value="warnings" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Historial de Amonestaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                <WarningsList
                  warnings={warnings}
                  isLoading={warningsLoading}
                  onWarningClick={(warningId) => {
                    console.log("Warning clicked:", warningId);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Estadísticas de Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                <UserStats />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
