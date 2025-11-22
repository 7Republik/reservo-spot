import { useNavigate } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOfflineMode } from '@/hooks/useOfflineMode';

export const AdminBlockScreen = () => {
  const { isOnline } = useOfflineMode();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full text-center p-8">
        <WifiOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Panel Admin no disponible offline
        </h2>
        
        <p className="text-muted-foreground mb-6">
          El panel de administración requiere conexión a internet para funcionar correctamente.
        </p>
        
        {isOnline ? (
          <Button 
            onClick={() => navigate('/admin')}
            className="w-full"
          >
            Reconectado - Acceder al Panel Admin
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="w-full"
          >
            Volver al Dashboard
          </Button>
        )}
      </Card>
    </div>
  );
};
