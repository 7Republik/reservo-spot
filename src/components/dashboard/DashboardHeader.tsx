import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Loader2 } from "lucide-react";
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
 * Displays company logo, user email, role badge, and logout button.
 * Responsive design adapts to mobile and desktop viewports.
 */
const DashboardHeader = ({ userEmail, userRole, isLoggingOut, onLogout }: DashboardHeaderProps) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "director": return "Director";
      case "preferred": return "Preferente";
      default: return "General";
    }
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
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{userEmail}</p>
              <Badge variant="secondary" className="text-xs">
                {getRoleLabel(userRole)}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
              onClick={onLogout}
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
  );
};

export default DashboardHeader;
