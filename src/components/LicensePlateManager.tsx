import { Card } from "@/components/ui/card";
import { useLicensePlateManager } from "@/hooks/useLicensePlateManager";
import { LicensePlateForm } from "./license-plates/LicensePlateForm";
import { LicensePlateCard } from "./license-plates/LicensePlateCard";
import { DeletedPlatesHistory } from "./license-plates/DeletedPlatesHistory";
import { DeletePlateDialog } from "./license-plates/DeletePlateDialog";
import { CachedDataIndicator } from "./CachedDataIndicator";

interface LicensePlateManagerProps {
  userId: string;
}

const LicensePlateManager = ({ userId }: LicensePlateManagerProps) => {
  const {
    activePlates,
    deletedPlates,
    newPlate,
    setNewPlate,
    loading,
    requestedElectric,
    setRequestedElectric,
    requestedDisability,
    setRequestedDisability,
    isFormOpen,
    setIsFormOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    plateToDelete,
    handleAddPlate,
    handleDeletePlate,
    openDeleteDialog,
    isOnline,
    lastSyncTime,
  } = useLicensePlateManager(userId);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Indicador de datos cacheados */}
      <CachedDataIndicator 
        lastSyncTime={lastSyncTime} 
        isOnline={isOnline}
      />

      <LicensePlateForm
        activePlatesCount={activePlates.length}
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        newPlate={newPlate}
        setNewPlate={setNewPlate}
        requestedElectric={requestedElectric}
        setRequestedElectric={setRequestedElectric}
        requestedDisability={requestedDisability}
        setRequestedDisability={setRequestedDisability}
        onAddPlate={handleAddPlate}
        isOnline={isOnline}
      />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Mis Matrículas</h3>
        
        {activePlates.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <p>No tienes matrículas registradas</p>
              <p className="text-sm mt-2">Añade tu primera matrícula para empezar</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {activePlates.map((plate) => (
              <LicensePlateCard
                key={plate.id}
                plate={plate}
                onDelete={openDeleteDialog}
                isOnline={isOnline}
              />
            ))}
          </div>
        )}
      </div>

      <DeletedPlatesHistory
        deletedPlates={deletedPlates}
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
      />

      <DeletePlateDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        plateToDelete={plateToDelete}
        onConfirmDelete={handleDeletePlate}
      />
    </div>
  );
};

export default LicensePlateManager;
