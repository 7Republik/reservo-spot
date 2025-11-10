import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls = ({ onZoomIn, onZoomOut, onReset }: ZoomControlsProps) => {
  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
      <Button size="icon" variant="secondary" onClick={onZoomIn} className="h-8 w-8 sm:h-10 sm:w-10 shadow-lg">
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="secondary" onClick={onZoomOut} className="h-8 w-8 sm:h-10 sm:w-10 shadow-lg">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="secondary" onClick={onReset} className="h-8 w-8 sm:h-10 sm:w-10 shadow-lg">
        <Maximize2 className="w-4 h-4" />
      </Button>
    </div>
  );
};
