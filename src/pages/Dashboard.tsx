import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ParkingSquare, Calendar } from "lucide-react";
import LicensePlateManager from "@/components/LicensePlateManager";
import AdminPanel from "@/components/AdminPanel";
import { CalendarTabContent } from "@/components/dashboard/CalendarTabContent";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import UserStatusGuard from "@/components/dashboard/UserStatusGuard";

/**
 * Main dashboard page
 * 
 * Provides access to parking reservations, license plate management,
 * and admin panel (for admins). Handles authentication state and
 * displays appropriate guards for blocked/deactivated users.
 */

const Dashboard = () => {
  const {
    user,
    loading,
    isAdmin,
    userRole,
    isLoggingOut,
    userStatus,
    handleLogout,
  } = useDashboardAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  // Show blocking UI if user is blocked or deactivated
  const statusGuard = <UserStatusGuard userStatus={userStatus} onLogout={handleLogout} />;
  if (userStatus.isBlocked || userStatus.isDeactivated) return statusGuard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <DashboardHeader
        userEmail={user.email || ""}
        userRole={userRole}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue={isAdmin ? "admin" : "calendar"} className="space-y-3 sm:space-y-6">
          <TabsList className="inline-flex w-auto bg-card/95 backdrop-blur-sm border-b border-border h-auto px-1 pb-0 pt-1 rounded-t-lg shadow-sm">
            <TabsTrigger 
              value="calendar" 
              className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold pb-2 pt-2 px-4 sm:px-6 text-muted-foreground mb-[-2px]"
            >
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger 
              value="licenses" 
              className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold pb-2 pt-2 px-4 sm:px-6 text-muted-foreground mb-[-2px]"
            >
              <ParkingSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Matrículas</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="admin" 
                className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold pb-2 pt-2 px-4 sm:px-6 text-muted-foreground mb-[-2px]"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="calendar" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            <CalendarTabContent userId={user.id} userRole={userRole} />
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
