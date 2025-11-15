import { Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const MobileHeatmapPlaceholder = () => {
  return (
    <Card className="md:hidden">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Smartphone className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Visualización no disponible en móvil
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          El heatmap de actividad solo está disponible en tablets y ordenadores
          para una mejor experiencia de visualización.
        </p>
      </CardContent>
    </Card>
  );
};
