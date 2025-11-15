import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MapIcon, List } from "lucide-react";
import logoReserveo from "@/assets/logo-reserveo.png";
import { useSpotSelection } from "@/hooks/useSpotSelection";
import { InteractiveMap } from "@/components/spot-selection/InteractiveMap";
import { SpotsList } from "@/components/spot-selection/SpotsList";
import { MapLegend } from "@/components/spot-selection/MapLegend";
import { DisabledControlTooltip } from "@/components/DisabledControlTooltip";
import { CachedDataIndicator } from "@/components/CachedDataIndicator";
import { WaitlistRegistration } from "@/components/waitlist/WaitlistRegistration";
import { useWaitlistSettings } from "@/hooks/useWaitlistSettings";

interface LocationState {
  userId: string;
  selectedDate: string;
  userGroups: string[];
  userGroupNames: string[];
  selectedGroupId: string | null;
  editingReservationId: string | null;
}

const SelectParkingSpot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const {
    selectedGroup,
    setSelectedGroup,
    availableGroups,
    spots,
    viewMode,
    setViewMode,
    loading,
    selectedDate,
    availableCount,
    getSpotColor,
    handleSpotClick,
    isOnline,
    lastSyncTime,
  } = useSpotSelection(state);

  const { settings, loading: settingsLoading } = useWaitlistSettings();

  // Determinar si mostrar lista de espera
  const showWaitlist = !loading && 
                       !settingsLoading && 
                       settings?.waitlist_enabled && 
                       availableCount === 0 && 
                       availableGroups.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* HEADER */}
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
        {/* Indicador de datos cacheados */}
        <CachedDataIndicator 
          lastSyncTime={lastSyncTime} 
          isOnline={isOnline}
        />

        {loading || settingsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : showWaitlist ? (
          <WaitlistRegistration
            date={selectedDate}
            availableGroups={availableGroups}
            onSuccess={() => navigate("/dashboard")}
            onCancel={() => navigate("/dashboard")}
          />
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

            <MapLegend />

            {viewMode === 'map' ? (
              <InteractiveMap
                selectedGroup={selectedGroup}
                spots={spots}
                onSpotClick={handleSpotClick}
                getSpotColor={getSpotColor}
                isOnline={isOnline}
              />
            ) : (
              <SpotsList
                spots={spots}
                onSpotClick={handleSpotClick}
                getSpotColor={getSpotColor}
                isOnline={isOnline}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SelectParkingSpot;
