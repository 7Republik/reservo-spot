import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  X
} from "lucide-react";
import type { IncidentReportWithDetails } from "@/types/incidents";
import { useIncidentManagement } from "@/hooks/admin/useIncidentManagement";
import { IncidentActions } from "./IncidentActions";
import { toast } from "sonner";
import { getIncidentPhotoUrl } from "@/lib/incidentHelpers";

interface IncidentDetailsProps {
  incidentId: string;
  onClose: () => void;
  onUpdate: () => void;
}

/**
 * IncidentDetails Component
 * 
 * Displays comprehensive details of a parking spot incident report.
 * Includes reporter info, spot details, photo evidence, offending user info,
 * warning history, and admin actions.
 * 
 * Features:
 * - Full incident information display in organized sections
 * - Photo evidence viewer with full-size modal
 * - Editable admin notes with auto-save
 * - Offending user warning history
 * - Confirm/Dismiss action buttons
 * - Mobile-responsive layout
 * 
 * @param {string} incidentId - ID of the incident to display
 * @param {Function} onClose - Callback when closing the details view
 * @param {Function} onUpdate - Callback after incident is updated
 */
export const IncidentDetails = ({ incidentId, onClose, onUpdate }: IncidentDetailsProps) => {
  const [incident, setIncident] = useState<IncidentReportWithDetails | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [warningCount, setWarningCount] = useState(0);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  
  const { 
    incidents,
    loadIncidents, 
    addAdminNotes, 
    confirmIncident, 
    dismissIncident,
    getUserWarningCount 
  } = useIncidentManagement();

  // Load incident details
  useEffect(() => {
    const loadIncidentDetails = async () => {
      await loadIncidents('all', true);
    };
    loadIncidentDetails();
  }, [incidentId]);

  // Find the specific incident from loaded incidents
  useEffect(() => {
    const foundIncident = incidents.find(inc => inc.id === incidentId);
    if (foundIncident) {
      setIncident(foundIncident);
      setAdminNotes(foundIncident.admin_notes || "");
    }
  }, [incidents, incidentId]);

  // Load signed URL for photo
  useEffect(() => {
    const loadPhotoUrl = async () => {
      if (incident?.photo_url) {
        setLoadingPhoto(true);
        const signedUrl = await getIncidentPhotoUrl(incident.photo_url);
        setPhotoUrl(signedUrl);
        setLoadingPhoto(false);
      }
    };
    loadPhotoUrl();
  }, [incident?.photo_url]);

  // Auto-save admin notes with debounce
  useEffect(() => {
    if (!incident || adminNotes === incident.admin_notes) return;
    
    const timer = setTimeout(async () => {
      setIsSavingNotes(true);
      await addAdminNotes(incidentId, adminNotes);
      setIsSavingNotes(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [adminNotes, incident, incidentId]);

  // Load warning count for offending user
  useEffect(() => {
    const loadWarningCount = async () => {
      if (incident?.offending_user_id) {
        const count = await getUserWarningCount(incident.offending_user_id);
        setWarningCount(count);
      }
    };
    loadWarningCount();
  }, [incident?.offending_user_id]);

  const handleConfirm = async (notes?: string) => {
    const success = await confirmIncident(incidentId, notes || adminNotes);
    
    if (success) {
      onUpdate();
      onClose();
    }
    
    return success;
  };

  const handleDismiss = async (reason?: string) => {
    const success = await dismissIncident(incidentId, reason || adminNotes);
    
    if (success) {
      onUpdate();
      onClose();
    }
    
    return success;
  };

  if (!incident) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Cargando detalles del incidente...</p>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (incident.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-warning text-warning gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="default" className="bg-success gap-1">
            <CheckCircle className="h-3 w-3" />
            Confirmado
          </Badge>
        );
      case 'dismissed':
        return (
          <Badge variant="outline" className="border-muted-foreground text-muted-foreground gap-1">
            <XCircle className="h-3 w-3" />
            Desestimado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Detalles del Incidente</h2>
          <p className="text-sm text-muted-foreground">ID: {incident.id.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reporter Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Usuario Afectado</h3>
        </div>
        <div className="space-y-1">
          <p className="font-medium">{incident.reporter.full_name}</p>
          <p className="text-sm text-muted-foreground">{incident.reporter.email}</p>
        </div>
      </Card>

      {/* Original Spot Section */}
      {incident.original_spot && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Plaza Original Reservada</h3>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-lg">Plaza {incident.original_spot.spot_number}</p>
            <p className="text-sm text-muted-foreground">{incident.original_spot.group_name}</p>
          </div>
        </Card>
      )}

      {/* Reassigned Spot Section */}
      {incident.reassigned_spot && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Plaza Reasignada</h3>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-lg text-blue-900 dark:text-blue-100">
              Plaza {incident.reassigned_spot.spot_number}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {incident.reassigned_spot.group_name}
            </p>
          </div>
        </Card>
      )}

      {/* Photo Evidence Section */}
      {incident.photo_url && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Evidencia Fotográfica</h3>
          </div>
          {loadingPhoto ? (
            <div className="w-full h-48 bg-muted rounded-lg border flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Cargando foto...</p>
            </div>
          ) : photoUrl ? (
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <img
                    src={photoUrl}
                    alt="Evidencia del incidente"
                    className="w-full h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Error loading image');
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Click para ver en tamaño completo
                  </p>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <VisuallyHidden>
                  <DialogTitle>Evidencia fotográfica del incidente</DialogTitle>
                  <DialogDescription>
                    Imagen en tamaño completo de la evidencia del incidente reportado
                  </DialogDescription>
                </VisuallyHidden>
                <img
                  src={photoUrl}
                  alt="Evidencia del incidente"
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error('Error loading full size image');
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <div className="w-full h-48 bg-muted rounded-lg border flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No se pudo cargar la foto</p>
            </div>
          )}
        </Card>
      )}

      {/* License Plate Section */}
      {incident.offending_license_plate && (
        <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-red-900 dark:text-red-100">Matrícula Infractora</h3>
          </div>
          <div className="flex items-center border-2 border-black rounded overflow-hidden shadow-sm w-fit">
            <div className="bg-[#003399] flex flex-col items-center justify-center px-2 py-2 text-white">
              <div className="text-xs leading-none mb-1" style={{ color: '#FFD700' }}>★</div>
              <div className="text-xs font-bold leading-none">E</div>
            </div>
            <div className="bg-white px-4 py-2">
              <div className="font-mono font-bold text-xl text-black tracking-wider">
                {incident.offending_license_plate}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Offending User Section */}
      {incident.offending_user && (
        <Card className="p-4 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-red-900 dark:text-red-100">Usuario Infractor</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="font-medium">{incident.offending_user.full_name}</p>
              <p className="text-sm text-muted-foreground">{incident.offending_user.email}</p>
            </div>
            {warningCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {warningCount} {warningCount === 1 ? 'amonestación' : 'amonestaciones'} previa(s)
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Timestamps Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Fechas</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reportado:</span>
            <span className="font-medium">
              {new Date(incident.created_at).toLocaleString('es-ES')}
            </span>
          </div>
          {incident.confirmed_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confirmado:</span>
              <span className="font-medium">
                {new Date(incident.confirmed_at).toLocaleString('es-ES')}
              </span>
            </div>
          )}
          {incident.resolved_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resuelto:</span>
              <span className="font-medium">
                {new Date(incident.resolved_at).toLocaleString('es-ES')}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Description Section */}
      {incident.description && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Descripción</h3>
          </div>
          <p className="text-sm">{incident.description}</p>
        </Card>
      )}

      {/* Admin Notes Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Notas del Administrador</h3>
          </div>
          {isSavingNotes && (
            <span className="text-xs text-muted-foreground">Guardando...</span>
          )}
        </div>
        <Textarea
          value={adminNotes || incident.admin_notes || ""}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Añade notas sobre este incidente..."
          className="min-h-[100px]"
          disabled={incident.status !== 'pending'}
        />
        {incident.status !== 'pending' && (
          <p className="text-xs text-muted-foreground mt-2">
            Las notas no se pueden editar en incidentes resueltos
          </p>
        )}
      </Card>

      <Separator />

      {/* Action Buttons */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-3">Acciones</h3>
        <IncidentActions
          incident={incident}
          onConfirm={handleConfirm}
          onDismiss={handleDismiss}
        />
      </Card>
    </div>
  );
};
