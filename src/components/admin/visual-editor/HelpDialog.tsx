import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Move, Edit, Hand, Info } from "lucide-react";
import { hasViewedHelp, markHelpAsViewed as markHelpViewed } from "@/lib/visualEditorStorage";

interface HelpSection {
  title: string;
  icon: React.ReactNode;
  content: string;
  tips: string[];
}

const helpSections: HelpSection[] = [
  {
    title: "Modo Dibujo",
    icon: <Pencil className="w-5 h-5" />,
    content: "Activa el modo dibujo para crear nuevas plazas haciendo clic en el plano.",
    tips: [
      "Ajusta el tamaño antes de dibujar",
      "El preview fantasma muestra dónde se creará la plaza",
      "Se desactiva automáticamente al alcanzar el límite"
    ]
  },
  {
    title: "Mover Plazas",
    icon: <Move className="w-5 h-5" />,
    content: "Haz clic y arrastra una plaza para moverla a una nueva posición.",
    tips: [
      "Desactiva el modo dibujo primero",
      "La posición se guarda automáticamente",
      "Verás una sombra en la posición original"
    ]
  },
  {
    title: "Editar Atributos",
    icon: <Edit className="w-5 h-5" />,
    content: "Haz clic en una plaza para editar su número y atributos.",
    tips: [
      "Los colores cambian según los atributos",
      "Plazas con múltiples atributos muestran colores divididos"
    ]
  },
  {
    title: "Navegación",
    icon: <Hand className="w-5 h-5" />,
    content: "Usa la herramienta mano para desplazarte por el plano sin afectar las plazas.",
    tips: [
      "Bloquea el canvas para hacer zoom con scroll",
      "Usa los controles de zoom en la esquina",
      "Presiona Escape para desbloquear"
    ]
  }
];

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpDialog = ({ open, onOpenChange }: HelpDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Guía del Editor Visual
          </DialogTitle>
          <DialogDescription>
            Aprende a usar todas las funcionalidades del editor visual de plazas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {helpSections.map((section, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                  {section.icon}
                </div>
                <h3 className="text-lg font-semibold">{section.title}</h3>
              </div>
              
              <p className="text-muted-foreground pl-13">
                {section.content}
              </p>

              {section.tips.length > 0 && (
                <div className="pl-13 space-y-2">
                  <p className="text-sm font-medium text-foreground">Tips:</p>
                  <ul className="space-y-1">
                    {section.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Hook para gestionar el tracking de primera visita
 */
export const useHelpDialogTracking = () => {
  const [shouldShowHelp, setShouldShowHelp] = useState(false);

  useEffect(() => {
    // Verificar si es la primera visita
    if (!hasViewedHelp()) {
      setShouldShowHelp(true);
    }
  }, []);

  const markHelpAsViewed = () => {
    markHelpViewed();
    setShouldShowHelp(false);
  };

  return {
    shouldShowHelp,
    markHelpAsViewed,
  };
};
