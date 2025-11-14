import { useState } from "react";
import { Loader2 } from "lucide-react";
import { LocationVerification } from "./LocationVerification";
import { EvidenceCapture } from "./EvidenceCapture";
import { SpotReassignment } from "./SpotReassignment";
import { IncidentCancellation } from "./IncidentCancellation";
import { useIncidentReport } from "@/hooks/useIncidentReport";
import type { SpotReassignmentResult } from "@/types/incidents";

/**
 * Step enum for the incident reporting flow
 */
enum IncidentStep {
  VERIFICATION = "verification",
  EVIDENCE = "evidence",
  REASSIGNMENT = "reassignment",
}

interface IncidentReportFlowProps {
  reservationId: string;
  spotId: string;
  spotNumber: string;
  groupName: string;
  reservationDate: string;
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * Main orchestrator component for the incident reporting flow
 * Manages multi-step state, data accumulation, and coordinates all sub-components
 * 
 * Flow: Verification → Evidence → Reassignment
 * 
 * Requirements: 1.1-1.5, 2.1-2.8, 3.1-3.6, 7.4, 10.1-10.5
 */
export const IncidentReportFlow = ({
  reservationId,
  spotId,
  spotNumber,
  groupName,
  reservationDate,
  userId,
  onComplete,
  onCancel,
}: IncidentReportFlowProps) => {
  // Step management
  const [currentStep, setCurrentStep] = useState<IncidentStep>(
    IncidentStep.VERIFICATION
  );

  // Form data accumulation
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [reassignmentResult, setReassignmentResult] =
    useState<SpotReassignmentResult | null>(null);

  // Cancellation dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Hook for business logic
  const { isLoading, createIncidentReport, cancelIncidentReport } =
    useIncidentReport();

  /**
   * Handles location verification confirmation
   * Transitions to evidence capture step
   */
  const handleLocationConfirmed = () => {
    setCurrentStep(IncidentStep.EVIDENCE);
  };

  /**
   * Handles evidence submission (photo + license plate)
   * Creates incident report and transitions to reassignment step
   */
  const handleEvidenceSubmit = async (photo: File, plate: string) => {
    // Store form data
    setPhotoFile(photo);
    setLicensePlate(plate);

    // Create incident report with automatic spot reassignment
    const result = await createIncidentReport({
      reservationId,
      originalSpotId: spotId,
      userId,
      date: reservationDate,
      description: `Plaza ${spotNumber} ocupada por vehículo con matrícula ${plate}`,
      offendingLicensePlate: plate,
      photoFile: photo,
    });

    // Store result and transition to reassignment step
    setReassignmentResult(result);
    setCurrentStep(IncidentStep.REASSIGNMENT);
  };

  /**
   * Handles back navigation from evidence capture
   * Returns to location verification
   */
  const handleBackToVerification = () => {
    setCurrentStep(IncidentStep.VERIFICATION);
  };

  /**
   * Handles cancellation request
   * Shows confirmation dialog if photo has been captured
   */
  const handleCancelRequest = () => {
    setShowCancelDialog(true);
  };

  /**
   * Handles confirmed cancellation
   * Cleans up uploaded photos and calls parent onCancel
   */
  const handleConfirmCancel = async () => {
    await cancelIncidentReport();
    onCancel();
  };

  /**
   * Handles completion of the flow
   * Calls parent onComplete callback
   */
  const handleComplete = () => {
    onComplete();
  };

  /**
   * Renders progress indicators
   */
  const renderProgressIndicators = () => {
    const steps = [
      { key: IncidentStep.VERIFICATION, label: "Verificación" },
      { key: IncidentStep.EVIDENCE, label: "Evidencia" },
      { key: IncidentStep.REASSIGNMENT, label: "Asignación" },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

    return (
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.key} className="flex items-center flex-1">
                {/* Step Circle */}
                <div
                  className={`
                    flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium
                    transition-colors duration-200
                    ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {index + 1}
                </div>

                {/* Step Label */}
                <span
                  className={`
                    ml-2 text-xs font-medium hidden sm:inline
                    ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  `}
                >
                  {step.label}
                </span>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-2
                      transition-colors duration-200
                      ${
                        isCompleted
                          ? "bg-primary"
                          : "bg-muted"
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Renders loading overlay
   */
  const renderLoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card border-border rounded-lg p-6 shadow-lg flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-foreground font-medium">
            Procesando reporte...
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Estamos buscando una plaza disponible y registrando tu incidente
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Progress Indicators */}
      <div className="flex-shrink-0">
        {renderProgressIndicators()}
      </div>

      {/* Step Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full flex items-start justify-center py-6">
          {currentStep === IncidentStep.VERIFICATION && (
            <LocationVerification
              spotNumber={spotNumber}
              groupName={groupName}
              onConfirm={handleLocationConfirmed}
              onCancel={handleCancelRequest}
            />
          )}

          {currentStep === IncidentStep.EVIDENCE && (
            <EvidenceCapture
              onSubmit={handleEvidenceSubmit}
              onBack={handleBackToVerification}
              onCancel={handleCancelRequest}
            />
          )}

          {currentStep === IncidentStep.REASSIGNMENT && reassignmentResult && (
            <SpotReassignment
              success={reassignmentResult.success}
              reassignedSpotNumber={reassignmentResult.reassignedSpotNumber}
              reassignedGroupId={reassignmentResult.reassignedGroupId}
              groupName={reassignmentResult.groupName}
              positionX={reassignmentResult.positionX}
              positionY={reassignmentResult.positionY}
              floorPlanUrl={reassignmentResult.floorPlanUrl}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {renderLoadingOverlay()}

      {/* Cancellation Dialog */}
      <IncidentCancellation
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        hasUploadedPhoto={photoFile !== null}
        onConfirmDiscard={handleConfirmCancel}
      />
    </div>
  );
};
