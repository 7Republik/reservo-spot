import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, AlertTriangle, AlertCircle } from "lucide-react";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { IncidentReportFlow } from "@/components/incidents";

interface ReservationDetailsModalProps {
  isOpen: boolean;
  reservation: {
    id: string;
    date: Date;
    spotNumber: string;
    groupName: string;
    spotId: string;
    userId: string;
    isAccessible: boolean;
    hasCharger: boolean;
    isCompact: boolean;
  } | null;
  onCancel: (reservationId: string) => void;
  onEdit: (reservationId: string, date: Date) => void;
  onClose: () => void;
  onIncidentReported?: () => void;
}

const ReservationDetailsModal = ({
  isOpen,
  reservation,
  onCancel,
  onEdit,
  onClose,
  onIncidentReported,
}: ReservationDetailsModalProps) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showIncidentReport, setShowIncidentReport] = useState(false);

  if (!reservation) return null;

  // Check if reservation is for today
  const isReservationToday = isToday(reservation.date);

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

  const handleReportIncident = () => {
    setShowIncidentReport(true);
  };

  const handleIncidentComplete = () => {
    setShowIncidentReport(false);
    onClose();
    // Refresh reservations list
    if (onIncidentReported) {
      onIncidentReported();
    }
  };

  const handleIncidentCancel = () => {
    setShowIncidentReport(false);
  };

  const attributes = [];
  if (reservation.isAccessible) attributes.push({ icon: "♿", label: "PMR" });
  if (reservation.hasCharger) attributes.push({ icon: "⚡", label: "Cargador" });
  if (reservation.isCompact) attributes.push({ icon: "🚗", label: "Reducida" });

  return (
    <>
      <Dialog open={isOpen && !showCancelConfirm && !showIncidentReport} onOpenChange={(open) => !open && onClose()}>
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
            {/* Report Incident Button - Only show for today's reservations */}
            {isReservationToday && (
              <Button
                variant="outline"
                className="w-full border-orange-500 text-orange-700 hover:bg-orange-50"
                onClick={handleReportIncident}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Reportar Incidencia
              </Button>
            )}
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

      {/* Incident Report Flow - Full screen dialog */}
      {showIncidentReport && reservation && (
        <Dialog open={showIncidentReport} onOpenChange={(open) => !open && handleIncidentCancel()}>
          <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden" aria-describedby="incident-report-description">
            <DialogTitle className="sr-only">Reportar Incidencia</DialogTitle>
            <DialogDescription id="incident-report-description" className="sr-only">
              Formulario para reportar una incidencia en tu plaza de parking reservada
            </DialogDescription>
            <IncidentReportFlow
              reservationId={reservation.id}
              spotId={reservation.spotId}
              spotNumber={reservation.spotNumber}
              groupName={reservation.groupName}
              reservationDate={format(reservation.date, "yyyy-MM-dd")}
              userId={reservation.userId}
              onComplete={handleIncidentComplete}
              onCancel={handleIncidentCancel}
            />
          </DialogContent>
        </Dialog>
      )}

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
