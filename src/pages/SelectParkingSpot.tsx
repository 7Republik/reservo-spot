import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ArrowLeft, MapIcon, List, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import logoReserveo from "@/assets/logo-reserveo.png";

interface LocationState {
  userId: string;
  selectedDate: string;
  userGroups: string[];
  userGroupNames: string[];
  selectedGroupId: string | null;
  editingReservationId: string | null;
}

interface ParkingGroup {
  id: string;
  name: string;
  description: string | null;
  floor_plan_url: string | null;
  capacity: number;
  button_size: number;
}

interface SpotWithStatus {
  id: string;
  spot_number: string;
  position_x: number | null;
  position_y: number | null;
  is_accessible: boolean;
  has_charger: boolean;
  is_compact: boolean;
  is_active: boolean;
  visual_size: string;
  status: 'available' | 'occupied' | 'user_reserved' | 'inactive';
}

const SelectParkingSpot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [selectedGroup, setSelectedGroup] = useState<ParkingGroup | null>(null);
  const [availableGroups, setAvailableGroups] = useState<ParkingGroup[]>([]);
  const [spots, setSpots] = useState<SpotWithStatus[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(true);

  const selectedDate = state?.selectedDate ? new Date(state.selectedDate) : new Date();
  const availableCount = spots.filter(s => s.status === 'available').length;

  useEffect(() => {
    if (!state?.userId || !state?.selectedDate) {
      toast.error("Datos de sesión inválidos");
      navigate("/dashboard");
    } else {
      loadAvailableGroups();
    }
  }, []);

  useEffect(() => {
    if (selectedGroup && selectedDate) {
      loadSpotsForGroup(selectedGroup.id, selectedDate);
    }
  }, [selectedGroup, selectedDate]);

  const loadAvailableGroups = async () => {
    try {
      setLoading(true);

      if (state.selectedGroupId) {
        const { data, error } = await supabase
          .from("parking_groups")
          .select("*")
          .eq("id", state.selectedGroupId)
          .eq("is_active", true)
          .single();

        if (error) throw error;

        setAvailableGroups([data]);
        setSelectedGroup(data);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("parking_groups")
        .select("*")
        .in("id", state.userGroups)
        .eq("is_active", true)
        .not("floor_plan_url", "is", null);

      if (error) throw error;

      setAvailableGroups(data || []);
      if (data && data.length > 0) {
        setSelectedGroup(data[0]);
      } else {
        toast.error("No hay grupos con planos disponibles");
      }
    } catch (error: any) {
      console.error("Error loading groups:", error);
      toast.error("Error al cargar los grupos");
    } finally {
      setLoading(false);
    }
  };

  const loadSpotsForGroup = async (groupId: string, date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");

      const { data: spotsData, error: spotsError } = await supabase
        .from("parking_spots")
        .select("*")
        .eq("group_id", groupId)
        .not("position_x", "is", null)
        .not("position_y", "is", null);

      if (spotsError) throw spotsError;

      const { data: reservations, error: reservationsError } = await supabase
        .from("reservations")
        .select("spot_id, user_id")
        .eq("reservation_date", dateStr)
        .eq("status", "active");

      if (reservationsError) throw reservationsError;

      const spotsWithStatus: SpotWithStatus[] = (spotsData || []).map(spot => {
        const reservation = reservations?.find(r => r.spot_id === spot.id);

        let status: SpotWithStatus['status'] = 'available';
        if (!spot.is_active) {
          status = 'inactive';
        } else if (reservation) {
          status = reservation.user_id === state.userId ? 'user_reserved' : 'occupied';
        }

        return {
          ...spot,
          status,
        };
      });

      setSpots(spotsWithStatus);
    } catch (error: any) {
      console.error("Error loading spots:", error);
      toast.error("Error al cargar las plazas");
    }
  };

  const getSpotColor = (spot: SpotWithStatus): string => {
    switch (spot.status) {
      case 'available':
        if (spot.is_accessible && spot.has_charger) return 'bg-green-500';
        if (spot.has_charger) return 'bg-yellow-500';
        if (spot.is_accessible) return 'bg-blue-500';
        return 'bg-emerald-500';
      case 'occupied':
        return 'bg-red-500';
      case 'user_reserved':
        return 'bg-blue-600';
      case 'inactive':
        return 'bg-gray-300';
      default:
        return 'bg-gray-400';
    }
  };

  const handleSpotClick = (spot: SpotWithStatus) => {
    if (spot.status !== 'available') {
      if (spot.status === 'occupied') {
        toast.error(`La plaza ${spot.spot_number} ya está ocupada`);
      } else if (spot.status === 'user_reserved') {
        toast.info(`Ya tienes reservada la plaza ${spot.spot_number} este día`);
      } else {
        toast.error(`La plaza ${spot.spot_number} no está disponible`);
      }
      return;
    }

    const attributes = [];
    if (spot.is_accessible) attributes.push('♿ PMR');
    if (spot.has_charger) attributes.push('⚡ Cargador');
    if (spot.is_compact) attributes.push('🚗 Reducida');

    const attributesText = attributes.length > 0 ? ` (${attributes.join(', ')})` : '';

    toast.success(`Plaza ${spot.spot_number}${attributesText} seleccionada`);

    navigate("/dashboard", {
      state: {
        selectedSpot: {
          spotId: spot.id,
          spotNumber: spot.spot_number,
          reservationDate: selectedDate.toISOString(),
          editingReservationId: state.editingReservationId
        }
      }
    });
  };

  const buttonSize = selectedGroup?.button_size || 32;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* HEADER FIJO */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <div className="flex items-center gap-2">
                <img src={logoReserveo} alt="RESERVEO" className="h-6 w-6 sm:h-8 sm:w-8" />
                <div className="hidden sm:block">
                  <h1 className="text-sm sm:text-base font-bold">Selecciona tu plaza</h1>
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </div>

            <Badge variant="secondary" className="text-xs sm:text-sm whitespace-nowrap">
              {availableCount} {availableCount === 1 ? 'disponible' : 'disponibles'}
            </Badge>
          </div>

          <div className="sm:hidden mt-2 text-center">
            <h2 className="text-sm font-semibold">Selecciona tu plaza</h2>
            <p className="text-xs text-muted-foreground">
              {format(selectedDate, "d MMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {availableGroups.length > 1 && !state.selectedGroupId && (
              <Tabs
                value={selectedGroup?.id}
                onValueChange={(id) => {
                  const group = availableGroups.find(g => g.id === id);
                  setSelectedGroup(group || null);
                }}
                className="w-full"
              >
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableGroups.length}, 1fr)` }}>
                  {availableGroups.map(group => (
                    <TabsTrigger key={group.id} value={group.id} className="text-xs sm:text-sm">
                      {group.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex-1 max-w-[150px] text-xs sm:text-sm"
              >
                <MapIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Mapa
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1 max-w-[150px] text-xs sm:text-sm"
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Lista
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-1 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-emerald-500 animate-pulse" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  Disponible
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-blue-500" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  ♿ PMR
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-yellow-500" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  ⚡ Cargador
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-red-500" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  Ocupada
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-blue-50 border border-blue-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-blue-600" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-blue-700 whitespace-nowrap">
                  Tu reserva
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-gray-300" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  No disponible
                </span>
              </div>
            </div>

            {viewMode === 'map' ? (
              <Card className="overflow-hidden">
                <TransformWrapper
                  initialScale={window.innerWidth < 640 ? 0.6 : 1}
                  minScale={window.innerWidth < 640 ? 0.5 : 1.0}
                  maxScale={3}
                  centerOnInit={false}
                  wheel={{ step: 0.1 }}
                  doubleClick={{ disabled: true }}
                  panning={{ disabled: false }}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                        <Button size="icon" variant="secondary" onClick={() => zoomIn()} className="h-8 w-8 sm:h-10 sm:w-10 shadow-lg">
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" onClick={() => zoomOut()} className="h-8 w-8 sm:h-10 sm:w-10 shadow-lg">
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" onClick={() => resetTransform()} className="h-8 w-8 sm:h-10 sm:w-10 shadow-lg">
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <TransformComponent
                        wrapperStyle={{
                          width: "100%",
                          height: window.innerWidth < 640 ? "350px" : window.innerWidth < 1024 ? "450px" : "550px",
                          backgroundColor: "#f9fafb"
                        }}
                        contentStyle={{
                          width: "100%",
                          minHeight: "100%"
                        }}
                      >
                        <div style={{ position: "relative", width: "100%", minHeight: "400px" }}>
                          {selectedGroup?.floor_plan_url ? (
                            <>
                              <img
                                src={selectedGroup.floor_plan_url}
                                alt={`Plano ${selectedGroup.name}`}
                                style={{ width: "100%", height: "auto", display: "block" }}
                              />

                              {spots.map(spot => (
                                <div
                                  key={spot.id}
                                  className={cn(
                                    "absolute transform -translate-x-1/2 -translate-y-1/2",
                                    "rounded-lg flex items-center justify-center",
                                    "text-white font-bold shadow-lg border-2 border-white",
                                    "transition-all duration-200",
                                    getSpotColor(spot),
                                    spot.status === 'available'
                                      ? "cursor-pointer hover:scale-125 hover:shadow-xl hover:z-50"
                                      : "cursor-not-allowed opacity-70"
                                  )}
                                  style={{
                                    left: `${spot.position_x}%`,
                                    top: `${spot.position_y}%`,
                                    width: `${buttonSize}px`,
                                    height: `${buttonSize}px`,
                                    fontSize: `${Math.max(buttonSize * 0.35, 10)}px`,
                                  }}
                                  onClick={() => handleSpotClick(spot)}
                                  title={`Plaza ${spot.spot_number} - ${spot.status === 'available' ? 'Disponible' :
                                    spot.status === 'occupied' ? 'Ocupada' :
                                      spot.status === 'user_reserved' ? 'Tu reserva' :
                                        'No disponible'
                                    }`}
                                >
                                  <span className="drop-shadow-md">
                                    {spot.spot_number.split('-')[1] || spot.spot_number}
                                  </span>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-64 text-muted-foreground">
                              No hay plano disponible
                            </div>
                          )}
                        </div>
                      </TransformComponent>
                    </>
                  )}
                </TransformWrapper>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-320px)] sm:h-[calc(100vh-280px)]">
                <div className="grid gap-2 sm:gap-3">
                  {spots
                    .sort((a, b) => {
                      if (a.status === 'available' && b.status !== 'available') return -1;
                      if (a.status !== 'available' && b.status === 'available') return 1;
                      return a.spot_number.localeCompare(b.spot_number);
                    })
                    .map(spot => (
                      <Card
                        key={spot.id}
                        className={cn(
                          "p-3 sm:p-4 transition-all duration-200",
                          spot.status === 'available'
                            ? "cursor-pointer hover:shadow-md hover:border-emerald-500"
                            : "opacity-60 cursor-not-allowed"
                        )}
                        onClick={() => handleSpotClick(spot)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-md",
                              getSpotColor(spot)
                            )}>
                              {spot.spot_number.split('-')[1] || spot.spot_number}
                            </div>
                            <div>
                              <p className="font-semibold text-sm sm:text-base">Plaza {spot.spot_number}</p>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {spot.is_accessible && (
                                  <Badge variant="outline" className="text-[0.65rem] sm:text-xs">♿ PMR</Badge>
                                )}
                                {spot.has_charger && (
                                  <Badge variant="outline" className="text-[0.65rem] sm:text-xs">⚡ Cargador</Badge>
                                )}
                                {spot.is_compact && (
                                  <Badge variant="outline" className="text-[0.65rem] sm:text-xs">🚗 Reducida</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant={spot.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                            {spot.status === 'available' ? 'Disponible' :
                              spot.status === 'occupied' ? 'Ocupada' :
                                spot.status === 'user_reserved' ? 'Tu reserva' :
                                  'No disponible'}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SelectParkingSpot;
