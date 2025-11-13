import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useLicensePlates } from "@/hooks/admin/useLicensePlates";
import { PendingPlateCard } from "./PendingPlateCard";
import { ApprovalDialog } from "./ApprovalDialog";
import { RejectionDialog } from "./RejectionDialog";
import { LicensePlatesSkeleton } from "../skeletons/AdminSkeletons";
import type { LicensePlate } from "@/types/admin";

export const LicensePlatesTab = () => {
  const {
    pendingPlates,
    loading,
    loadPendingPlates,
    approvePlate,
    rejectPlate,
  } = useLicensePlates();

  const [selectedPlate, setSelectedPlate] = useState<LicensePlate | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(null);

  useEffect(() => {
    // Forzar recarga cada vez que se monta el componente
    loadPendingPlates(true);
  }, []);

  const handleApproveClick = (plate: LicensePlate) => {
    setSelectedPlate(plate);
    setApprovalDialogOpen(true);
  };

  const handleRejectClick = (plateId: string) => {
    setSelectedPlateId(plateId);
    setRejectionDialogOpen(true);
  };

  const handleApproveConfirm = async (
    plateId: string,
    approveElectric: boolean,
    approveDisability: boolean
  ) => {
    await approvePlate(plateId, approveElectric, approveDisability);
  };

  const handleRejectConfirm = async (plateId: string, reason: string) => {
    await rejectPlate(plateId, reason);
  };

  if (loading) {
    return <LicensePlatesSkeleton />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Matrículas Pendientes de Aprobación
          </CardTitle>
          <CardDescription>
            Revisa y aprueba las solicitudes de registro de matrículas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPlates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay matrículas pendientes de aprobación
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPlates.map((plate) => (
                <PendingPlateCard
                  key={plate.id}
                  plate={plate}
                  onApprove={handleApproveClick}
                  onReject={handleRejectClick}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        plate={selectedPlate}
        onConfirm={handleApproveConfirm}
      />

      <RejectionDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
        plateId={selectedPlateId}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
};
