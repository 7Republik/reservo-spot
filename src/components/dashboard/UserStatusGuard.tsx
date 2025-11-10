import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStatus } from "@/hooks/useDashboardAuth";

interface UserStatusGuardProps {
  userStatus: UserStatus;
  onLogout: () => void;
}

/**
 * User status guard component
 * 
 * Displays blocking messages when user is blocked or deactivated.
 * Prevents access to dashboard functionality and shows appropriate
 * error messages with logout option.
 */
const UserStatusGuard = ({ userStatus, onLogout }: UserStatusGuardProps) => {
  if (userStatus.isBlocked) {
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
              <p className="text-sm text-muted-foreground">{userStatus.blockReason}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Por favor, contacta con el administrador de la empresa para resolver esta situación.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onLogout}
            >
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userStatus.isDeactivated) {
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
              onClick={onLogout}
            >
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default UserStatusGuard;
