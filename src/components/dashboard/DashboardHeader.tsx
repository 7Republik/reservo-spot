import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Loader2, User, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AlertBadge from "@/components/dashboard/AlertBadge";
import { useUserWarnings } from "@/hooks/useUserWarnings";
import { useNavigate } from "react-router-dom";
import logoReserveo from "@/assets/logo-reserveo.png";

interface DashboardHeaderProps {
  userEmail: string;
  userRole: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}

/**
 * Dashboard header component
 * 
 * Displays company logo, user email, role badge, alert badge for warnings,
 * user avatar dropdown menu with profile and warnings navigation, and logout button.
 * Responsive design adapts to mobile and desktop viewports.
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1
 */
const DashboardHeader = ({ userEmail, userRole, isLoggingOut, onLogout }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { unviewedCount } = useUserWarnings();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "director": return "Director";
      case "preferred": return "Preferente";
      default: return "General";
    }
  };

  // Get user initials for avatar
  const getUserInitials = (email: string) => {
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  // Navigation handlers
  const handleNavigateToProfile = () => {
    navigate('/profile?tab=personal');
  };

  const handleNavigateToWarnings = () => {
    navigate('/profile?tab=warnings');
  };

  return (
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
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Alert Badge for unviewed warnings */}
            <AlertBadge 
              count={unviewedCount} 
              onClick={handleNavigateToWarnings}
            />

            {/* User Avatar Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full"
                  aria-label="Menú de usuario"
                >
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-semibold">
                      {getUserInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Badge indicator on avatar if there are unviewed warnings */}
                  {unviewedCount > 0 && (
                    <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userEmail}</p>
                    <Badge variant="secondary" className="text-xs w-fit mt-1">
                      {getRoleLabel(userRole)}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNavigateToProfile}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNavigateToWarnings}>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Amonestaciones</span>
                  {unviewedCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {unviewedCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
