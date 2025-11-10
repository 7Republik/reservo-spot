import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

interface ReservationDetailsModalProps {
  isOpen: boolean;
  reservation: {
    id: string;
    date: Date;
    spotNumber: string;
    groupName: string;
    spotId: string;
    isAccessible: boolean;
    hasCharger: boolean;
    isCompact: boolean;
  } | null;
  onCancel: (reservationId: string) => void;
  onEdit: (reservationId: string, date: Date) => void;
  onClose: () => void;
}

const ReservationDetailsModal = ({
  isOpen,
  reservation,
  onCancel,
  onEdit,
  onClose,
}: ReservationDetailsModalProps) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!reservation) return null;

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    onCancel(reservation.id);
    setShowCancelConfirm(false);
    onClose();
  };

  const handleEditClick = () => {
    onEdit(reservation.id, reservation.date);
    onClose();
  };

  const attributes = [];
  if (reservation.isAccessible) attributes.push({ icon: "♿", label: "PMR" });
  if (reservation.hasCharger) attributes.push({ icon: "⚡", label: "Cargador" });
  if (reservation.isCompact) attributes.push({ icon: "🚗", label: "Reducida" });

  return (
    <>
      <Dialog open={isOpen && !showCancelConfirm} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Tu Reserva
            </DialogTitle>
            <DialogDescription>
              Detalles de tu plaza reservada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Fecha */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Fecha</p>
                  <p className="text-sm font-bold text-blue-900 capitalize">
                    {format(reservation.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Plaza */}
            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Plaza</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {reservation.spotNumber}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {attributes.map((attr, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {attr.icon} {attr.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Grupo */}
            <Card className="p-4 bg-gray-50 border-gray-200">
              <div>
                <p className="text-xs text-gray-600 font-medium">Grupo de parking</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {reservation.groupName}
                </p>
              </div>
            </Card>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              variant="outline"
              className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50"
              onClick={handleEditClick}
            >
              Cambiar Plaza
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancelClick}
            >
              Cancelar Reserva
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              ¿Cancelar reserva?
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cancelar la reserva de la plaza{" "}
              <span className="font-bold">{reservation.spotNumber}</span> para el{" "}
              <span className="font-bold capitalize">
                {format(reservation.date, "d 'de' MMMM", { locale: es })}
              </span>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener reserva</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive hover:bg-destructive/90">
              Sí, cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReservationDetailsModal;
