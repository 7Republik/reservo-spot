import { useState, useRef } from "react";
import { Camera, Upload, X, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isValidImageType, isValidFileSize } from "@/lib/incidentHelpers";

interface EvidenceCaptureProps {
  onSubmit: (photo: File, licensePlate: string) => void;
  onBack: () => void;
  onCancel: () => void;
}

export const EvidenceCapture = ({
  onSubmit,
  onBack,
  onCancel,
}: EvidenceCaptureProps) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [licensePlateError, setLicensePlateError] = useState("");
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validates and processes the selected image file
   */
  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!isValidImageType(file)) {
      toast.error("Formato de imagen no válido. Por favor, sube una imagen JPEG, PNG o HEIC.");
      return;
    }

    // Validate file size (max 10MB)
    if (!isValidFileSize(file, 10)) {
      toast.error("El archivo es demasiado grande. El tamaño máximo es 10MB.");
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Clean up previous preview
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(previewUrl);
  };

  /**
   * Handles camera capture button click
   */
  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  /**
   * Handles file upload button click
   */
  const handleFileUpload = () => {
    uploadInputRef.current?.click();
  };

  /**
   * Handles retake/reselect photo
   */
  const handleRetakePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  /**
   * Validates license plate input
   */
  const validateLicensePlate = (value: string): boolean => {
    if (!value.trim()) {
      setLicensePlateError("La matrícula es obligatoria");
      return false;
    }

    if (value.trim().length < 4) {
      setLicensePlateError("La matrícula debe tener al menos 4 caracteres");
      return false;
    }

    if (value.trim().length > 15) {
      setLicensePlateError("La matrícula no puede tener más de 15 caracteres");
      return false;
    }

    setLicensePlateError("");
    return true;
  };

  /**
   * Handles license plate input change
   */
  const handleLicensePlateChange = (value: string) => {
    setLicensePlate(value);
    if (licensePlateError) {
      validateLicensePlate(value);
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = () => {
    // Validate photo
    if (!photoFile) {
      toast.error("Por favor, captura o sube una foto de la plaza ocupada");
      return;
    }

    // Validate license plate
    if (!validateLicensePlate(licensePlate)) {
      toast.error("Por favor, introduce una matrícula válida");
      return;
    }

    // Submit
    onSubmit(photoFile, licensePlate);
  };

  return (
    <div className="w-full max-w-md mx-auto p-2 sm:p-4">
      <Card className="bg-card border-border">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-xl">
              Evidencia del Incidente
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription className="text-muted-foreground">
            Captura una foto y registra la matrícula del vehículo
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Photo Capture Section */}
          <div className="space-y-3">
            <Label className="text-foreground font-medium">
              Foto de la plaza ocupada
            </Label>

            {!photoPreview ? (
              /* Photo Capture Buttons */
              <div className="space-y-3">
                <Button
                  onClick={handleCameraCapture}
                  variant="outline"
                  className="w-full h-16 text-base"
                  size="lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capturar con cámara
                </Button>

                <Button
                  onClick={handleFileUpload}
                  variant="outline"
                  className="w-full h-16 text-base"
                  size="lg"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Subir desde galería
                </Button>

                {/* Hidden file inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
            ) : (
              /* Photo Preview */
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted">
                  <img
                    src={photoPreview}
                    alt="Vista previa de la foto"
                    className="w-full h-auto max-h-48 sm:max-h-64 object-contain"
                  />
                </div>

                <Button
                  onClick={handleRetakePhoto}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Repetir foto
                </Button>
              </div>
            )}
          </div>

          {/* License Plate Input */}
          <div className="space-y-3">
            <Label htmlFor="license-plate" className="text-foreground font-medium">
              Matrícula del vehículo ocupante
            </Label>
            
            <Input
              id="license-plate"
              type="text"
              placeholder="Ej: 1234ABC"
              value={licensePlate}
              onChange={(e) => handleLicensePlateChange(e.target.value)}
              onBlur={() => validateLicensePlate(licensePlate)}
              className={`h-12 text-base uppercase ${
                licensePlateError ? "border-destructive" : ""
              }`}
              maxLength={15}
            />

            {licensePlateError && (
              <div className="flex items-start gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{licensePlateError}</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Introduce la matrícula del vehículo que está ocupando tu plaza
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base"
              size="lg"
              disabled={!photoFile || !licensePlate.trim()}
            >
              Continuar
            </Button>

            <Button
              onClick={onBack}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Volver
            </Button>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-center text-muted-foreground">
            La foto y matrícula serán revisadas por el equipo administrativo
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
