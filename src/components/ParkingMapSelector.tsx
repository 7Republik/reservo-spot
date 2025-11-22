import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MapIcon, List, ZoomIn, ZoomOut, Maximize2, Accessibility, Zap, Car } from "lucide-react";
import { getSpotAttributesText } from "@/lib/spotIcons";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ParkingMapSelectorProps {
  userId: string;
  selectedDate: Date | null;
  userGroups: string[];
  selectedGroupId: string | null;
  onSpotSelected: (spotId: string, spotNumber: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface ParkingGroup {
  id: string;
  name: string;
  description: string | null;
  floor_plan_url: string | null;
  capacity: number;
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

const ParkingMapSelector = ({ 
  userId, 
  selectedDate, 
  userGroups,
  selectedGroupId,
  onSpotSelected, 
  onCancel, 
  isOpen 
}: ParkingMapSelectorProps) => {
  const [selectedGroup, setSelectedGroup] = useState<ParkingGroup | null>(null);
  const [availableGroups, setAvailableGroups] = useState<ParkingGroup[]>([]);
  const [spots, setSpots] = useState<SpotWithStatus[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(true);
  const [buttonSize, setButtonSize] = useState(32);

  useEffect(() => {
    if (isOpen && selectedDate && userGroups.length > 0) {
      loadAvailableGroups();
    }
  }, [isOpen, selectedDate, userGroups]);

  useEffect(() => {
    if (selectedGroup && selectedDate) {
      loadSpotsForGroup(selectedGroup.id, selectedDate);
    }
  }, [selectedGroup, selectedDate]);

  const loadAvailableGroups = async () => {
    try {
      setLoading(true);
      
      // Si hay grupo pre-seleccionado, cargar solo ese
      if (selectedGroupId) {
        const { data, error } = await supabase
          .from("parking_groups")
          .select("*")
          .eq("id", selectedGroupId)
          .eq("is_active", true)
          .single();

        if (error) throw error;
        
        setAvailableGroups([data]);
        setSelectedGroup(data);
        setLoading(false);
        return;
      }

      // Comportamiento original si no hay grupo pre-seleccionado
      const { data, error } = await supabase
        .from("parking_groups")
        .select("*")
        .in("id", userGroups)
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

      // Cargar button_size del grupo
      const { data: groupData } = await supabase
        .from("parking_groups")
        .select("button_size")
        .eq("id", groupId)
        .single();
      
      setButtonSize(groupData?.button_size || 32);

      // Load all spots from the group with defined positions
      const { data: spotsData, error: spotsError } = await supabase
        .from("parking_spots")
        .select("*")
        .eq("group_id", groupId)
        .not("position_x", "is", null)
        .not("position_y", "is", null);

      if (spotsError) throw spotsError;

      // Load reservations for that date
      const { data: reservations, error: reservationsError } = await supabase
        .from("reservations")
        .select("spot_id, user_id")
        .eq("reservation_date", dateStr)
        .eq("status", "active");

      if (reservationsError) throw reservationsError;

      // Determine status for each spot
      const spotsWithStatus: SpotWithStatus[] = (spotsData || []).map(spot => {
        const reservation = reservations?.find(r => r.spot_id === spot.id);
        
        let status: SpotWithStatus['status'] = 'available';
        if (!spot.is_active) {
          status = 'inactive';
        } else if (reservation) {
          status = reservation.user_id === userId ? 'user_reserved' : 'occupied';
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

    const attributesText = getSpotAttributesText(spot);
    const formattedAttributes = attributesText ? ` (${attributesText})` : '';
    
    toast.success(`Plaza ${spot.spot_number}${attributesText} seleccionada`);
    onSpotSelected(spot.id, spot.spot_number);
  };

  if (!selectedDate) return null;

  const availableCount = spots.filter(s => s.status === 'available').length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-6xl max-h-[90vh] sm:max-h-[90vh] h-auto overflow-hidden w-[95vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle>Selecciona tu plaza de parking</DialogTitle>
          <DialogDescription>
            Haz clic en una plaza verde para reservarla para el {format(selectedDate, "d 'de' MMMM, yyyy")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Group selector (if multiple groups and no pre-selected group) */}
            {availableGroups.length > 1 && !selectedGroupId && (
              <Tabs 
                value={selectedGroup?.id} 
                onValueChange={(id) => {
                  const group = availableGroups.find(g => g.id === id);
                  setSelectedGroup(group || null);
                }}
              >
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableGroups.length}, 1fr)` }}>
                  {availableGroups.map(group => (
                    <TabsTrigger key={group.id} value={group.id}>
                      {group.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {/* View mode toggle */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  <MapIcon className="w-4 h-4 mr-2" />
                  Vista Mapa
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4 mr-2" />
                  Vista Lista
                </Button>
              </div>

              <Badge variant="secondary" className="text-sm">
                {availableCount} {availableCount === 1 ? 'plaza disponible' : 'plazas disponibles'}
              </Badge>
            </div>

            {/* Legend - Ultra compacta para móvil */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-1 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
              {/* Disponible */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-emerald-500 animate-pulse" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  Disponible
                </span>
              </div>
              
              {/* PMR */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-blue-500" />
                <Accessibility className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  PMR
                </span>
              </div>
              
              {/* Cargador */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-yellow-500" />
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  Cargador
                </span>
              </div>
              
              {/* Ocupada */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-red-500" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  Ocupada
                </span>
              </div>
              
              {/* Tu reserva */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-blue-50 border border-blue-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-blue-600" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-blue-700 whitespace-nowrap">
                  Tu reserva
                </span>
              </div>
              
              {/* No disponible */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-gray-300" />
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                  No disponible
                </span>
              </div>
            </div>

            {/* Main content */}
            <ScrollArea className="h-[500px]">
              {viewMode === 'map' ? (
                // Map view CON ZOOM/PAN
                <div className="relative">
                  <TransformWrapper
                    initialScale={1}
                    minScale={1.0}
                    maxScale={3}
                    centerOnInit={false}
                    wheel={{ step: 0.1 }}
                    doubleClick={{ disabled: true }}
                    panning={{ disabled: false }}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        {/* Controles de zoom */}
                        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => zoomIn()}
                            className="shadow-lg"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => zoomOut()}
                            className="shadow-lg"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => resetTransform()}
                            className="shadow-lg"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <TransformComponent
                          wrapperStyle={{
                            width: "100%",
                            height: window.innerWidth < 640 ? "400px" : "500px",
                            border: "2px solid #e5e7eb",
                            borderRadius: "0.5rem",
                            overflow: "hidden",
                            backgroundColor: "#f9fafb"
                          }}
                          contentStyle={{
                            minWidth: "100%",
                            minHeight: "100%"
                          }}
                        >
                          <div style={{ 
                            position: "relative", 
                            width: "100%", 
                            minWidth: "600px",
                            minHeight: "400px"
                          }}>
                            {selectedGroup?.floor_plan_url ? (
                              <>
                                <img
                                  src={selectedGroup.floor_plan_url}
                                  alt={`Plano de ${selectedGroup.name}`}
                                  style={{
                                    width: "100%",
                                    height: "auto",
                                    display: "block"
                                  }}
                                />
                                
                                {/* Spots overlay - TAMAÑO DINÁMICO */}
                                {spots.map(spot => (
                                  <div
                                    key={spot.id}
                                    className={cn(
                                      "absolute transform -translate-x-1/2 -translate-y-1/2",
                                      "rounded-lg flex flex-col items-center justify-center",
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
                                      fontSize: `${buttonSize * 0.3}px`,
                                    }}
                                    onClick={() => handleSpotClick(spot)}
                                    title={`Plaza ${spot.spot_number} - ${
                                      spot.status === 'available' ? 'Disponible' :
                                      spot.status === 'occupied' ? 'Ocupada' :
                                      spot.status === 'user_reserved' ? 'Tu reserva' :
                                      'No disponible'
                                    }`}
                                  >
                                    <span style={{ fontSize: `${buttonSize * 0.35}px` }}>
                                      {spot.spot_number.split('-')[1] || spot.spot_number}
                                    </span>
                                    <div className="flex gap-0.5 mt-0.5">
                                      {spot.is_accessible && <Accessibility size={buttonSize * 0.25} className="text-blue-600" />}
                                      {spot.has_charger && <Zap size={buttonSize * 0.25} className="text-yellow-600" />}
                                      {spot.is_compact && <Car size={buttonSize * 0.25} className="text-gray-600" />}
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-64 text-muted-foreground">
                                No hay plano disponible para este grupo
                              </div>
                            )}
                          </div>
                        </TransformComponent>
                      </>
                    )}
                  </TransformWrapper>
                </div>
              ) : (
                // List view
                <div className="grid gap-2">
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
                          "p-3 transition-all duration-200",
                          spot.status === 'available' 
                            ? "cursor-pointer hover:shadow-md hover:border-emerald-500" 
                            : "opacity-60 cursor-not-allowed"
                        )}
                        onClick={() => handleSpotClick(spot)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-4 h-4 rounded-full",
                              getSpotColor(spot)
                            )} />
                            <div>
                              <p className="font-semibold">{spot.spot_number}</p>
                              <div className="flex gap-2 mt-1">
                                {spot.is_accessible && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Accessibility className="w-3 h-3" /> PMR
                                  </Badge>
                                )}
                                {spot.has_charger && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Cargador
                                  </Badge>
                                )}
                                {spot.is_compact && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Car className="w-3 h-3" /> Reducida
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant={
                            spot.status === 'available' ? 'default' :
                            spot.status === 'user_reserved' ? 'secondary' :
                            'destructive'
                          }>
                            {spot.status === 'available' && 'Disponible'}
                            {spot.status === 'occupied' && 'Ocupada'}
                            {spot.status === 'user_reserved' && 'Tu reserva'}
                            {spot.status === 'inactive' && 'No disponible'}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParkingMapSelector;
