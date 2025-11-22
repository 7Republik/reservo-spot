import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomControls } from "@/components/spot-selection/ZoomControls";
import logoReserveo from "@/assets/logo-reserveo.png";

interface LocationState {
  spotId: string;
  spotNumber: string;
  groupName: string;
  date: string;
  isAccessible?: boolean;
  hasCharger?: boolean;
  isCompact?: boolean;
}

/**
 * Página para visualizar la ubicación de una plaza reservada en el plano
 * Modo de solo visualización - no permite seleccionar otras plazas
 */
const ViewSpotLocation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [spotData, setSpotData] = useState<any>(null);
  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpotLocation = async () => {
      if (!state?.spotId) {
        navigate(-1);
        return;
      }

      try {
        // Intentar cargar desde caché primero
        const { offlineCache } = await import('@/lib/offlineCache');
        const { useOfflineMode } = await import('@/hooks/useOfflineMode');
        
        // Verificar si estamos offline
        const isOffline = !navigator.onLine;
        
        if (isOffline) {
          // Buscar en caché de grupos
          const groups = await offlineCache.get<any[]>('groups');
          if (groups) {
            // Buscar el grupo que contiene esta plaza
            for (const group of groups) {
              const spots = await offlineCache.get<any[]>(`spots_${group.id}`);
              if (spots) {
                const spot = spots.find(s => s.id === state.spotId);
                if (spot) {
                  setSpotData(spot);
                  setGroupData(group);
                  setLoading(false);
                  return;
                }
              }
            }
          }
          
          // Si no hay datos en caché, mostrar error
          setLoading(false);
          return;
        }

        // Online: Cargar desde servidor
        const { data: spot, error: spotError } = await supabase
          .from("parking_spots")
          .select(`
            *,
            parking_groups (
              id,
              name,
              floor_plan_url,
              button_size
            )
          `)
          .eq("id", state.spotId)
          .single();

        if (spotError) throw spotError;

        setSpotData(spot);
        setGroupData((spot as any).parking_groups);
        
        // Cachear para uso offline
        const groupData = (spot as any).parking_groups;
        if (groupData) {
          await offlineCache.set(`spots_${groupData.id}`, [spot]);
        }
      } catch (error) {
        console.error("Error loading spot location:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSpotLocation();
  }, [state, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!spotData || !groupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se pudo cargar la ubicación</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const buttonSize = groupData.button_size || 32;
  const attributes = [];
  if (state.isAccessible) attributes.push({ icon: "♿", label: "PMR" });
  if (state.hasCharger) attributes.push({ icon: "⚡", label: "Cargador" });
  if (state.isCompact) attributes.push({ icon: "🚗", label: "Reducida" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-1 sm:gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden xs:inline">Volver</span>
              </Button>
              <div className="h-6 w-px bg-border" />
              <img src={logoReserveo} alt="Reserveo" className="h-6 sm:h-7" />
            </div>

            <Badge variant="default" className="bg-primary">
              <MapPin className="w-3 h-3 mr-1" />
              Ubicación
            </Badge>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Info Card */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h1 className="text-xl sm:text-2xl font-bold">Tu Plaza Reservada</h1>
                </div>
                <p className="text-sm text-muted-foreground capitalize mb-4">
                  {format(new Date(state.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>

                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Plaza</p>
                    <p className="text-3xl font-bold text-primary">{state.spotNumber}</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Grupo</p>
                    <p className="text-lg font-semibold">{state.groupName}</p>
                  </div>
                </div>

                {attributes.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {attributes.map((attr, index) => (
                      <Badge key={index} variant="secondary">
                        {attr.icon} {attr.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Map Card */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ubicación en el Plano
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Usa los controles para hacer zoom y moverte por el plano
              </p>
            </div>

            {groupData.floor_plan_url ? (
              <div className="relative">
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={4}
                  centerOnInit={true}
                  wheel={{ step: 0.1 }}
                  doubleClick={{ mode: "zoomIn" }}
                  panning={{ velocityDisabled: true }}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <ZoomControls
                        onZoomIn={() => zoomIn()}
                        onZoomOut={() => zoomOut()}
                        onReset={() => resetTransform()}
                      />

                      <TransformComponent
                        wrapperStyle={{
                          width: "100%",
                          height: window.innerWidth < 640 ? "400px" : window.innerWidth < 1024 ? "500px" : "600px",
                          backgroundColor: "#f9fafb"
                        }}
                        contentStyle={{
                          width: "100%",
                          minHeight: "100%"
                        }}
                      >
                      <div style={{ position: "relative", width: "100%", minHeight: "400px" }}>
                        <img
                          src={groupData.floor_plan_url}
                          alt={`Plano ${groupData.name}`}
                          style={{ width: "100%", height: "auto", display: "block" }}
                        />

                        {/* Plaza resaltada */}
                        {spotData.position_x !== null && spotData.position_y !== null && (
                          <div
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-lg flex items-center justify-center text-white font-bold shadow-2xl border-4 border-white animate-pulse"
                            style={{
                              left: `${spotData.position_x}%`,
                              top: `${spotData.position_y}%`,
                              width: `${buttonSize * 1.5}px`,
                              height: `${buttonSize * 1.5}px`,
                              fontSize: `${Math.max(buttonSize * 0.5, 14)}px`,
                              backgroundColor: "#10b981",
                              boxShadow: "0 0 30px rgba(16, 185, 129, 0.6)",
                            }}
                          >
                            <span className="drop-shadow-md">
                              {spotData.spot_number.split('-')[1] || spotData.spot_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay plano disponible para este grupo</p>
                </div>
              </div>
            )}
          </Card>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewSpotLocation;
