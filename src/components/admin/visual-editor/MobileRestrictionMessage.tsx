import { useNavigate } from "react-router-dom";
import { Monitor } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Componente que muestra un mensaje informativo cuando el usuario
 * intenta acceder al Editor Visual desde un dispositivo móvil.
 * 
 * El editor visual requiere una pantalla de al menos 768px de ancho
 * para funcionar correctamente debido a la complejidad de la interfaz.
 */
export const MobileRestrictionMessage = () => {
  const navigate = useNavigate();

  return (
    <Card className="m-4">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <Monitor className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold text-center">
          Editor Visual no disponible en móvil
        </h3>
        <p className="text-center text-muted-foreground max-w-md">
          El Editor Visual requiere una pantalla de tablet o PC para funcionar correctamente.
          Por favor, accede desde un dispositivo con pantalla más grande.
        </p>
        <Button onClick={() => navigate('/admin')}>
          Volver al Panel Admin
        </Button>
      </CardContent>
    </Card>
  );
};
