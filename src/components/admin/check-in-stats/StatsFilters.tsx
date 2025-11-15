import { useState, useEffect } from 'react';
import { Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckInStatsFilters, DateRangePreset } from '@/types/admin/check-in-stats';
import { supabase } from '@/integrations/supabase/client';

interface StatsFiltersProps {
  filters: CheckInStatsFilters;
  onFiltersChange: (filters: CheckInStatsFilters) => void;
  onExportTopUsers: () => void;
  onExportAllReservations: () => void;
  isExporting?: boolean;
}

export const StatsFilters = ({
  filters,
  onFiltersChange,
  onExportTopUsers,
  onExportAllReservations,
  isExporting = false,
}: StatsFiltersProps) => {
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last7days');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Cargar grupos de parking
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('parking_groups')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  // Aplicar preset de fecha
  const applyDatePreset = (preset: DateRangePreset) => {
    setDatePreset(preset);
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (preset) {
      case 'last7days':
        startDate = subDays(now, 7);
        break;
      case 'last30days':
        startDate = subDays(now, 30);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      startDate,
      endDate,
    });
  };

  const handleGroupChange = (value: string) => {
    onFiltersChange({
      ...filters,
      groupId: value === 'all' ? null : value,
    });
  };

  const handleCustomDateChange = (date: Date | undefined, type: 'start' | 'end') => {
    if (!date) return;

    setDatePreset('custom');
    onFiltersChange({
      ...filters,
      [type === 'start' ? 'startDate' : 'endDate']: date,
    });
  };

  const formatDateRange = () => {
    return `${format(filters.startDate, 'dd MMM', { locale: es })} - ${format(
      filters.endDate,
      'dd MMM yyyy',
      { locale: es }
    )}`;
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Selector de Grupo */}
        <div className="w-full sm:w-[200px]">
          <Select
            value={filters.groupId || 'all'}
            onValueChange={handleGroupChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grupos</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de Rango de Fecha */}
        <div className="flex gap-2">
          <Select
            value={datePreset}
            onValueChange={(value) => applyDatePreset(value as DateRangePreset)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Últimos 7 días</SelectItem>
              <SelectItem value="last30days">Últimos 30 días</SelectItem>
              <SelectItem value="thisMonth">Este mes</SelectItem>
              <SelectItem value="lastMonth">Mes anterior</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Picker para rango personalizado */}
          {datePreset === 'custom' && (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex flex-col gap-2 p-3">
                  <div className="text-sm font-medium">Fecha de inicio</div>
                  <CalendarComponent
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => handleCustomDateChange(date, 'start')}
                    locale={es}
                  />
                  <div className="text-sm font-medium mt-2">Fecha de fin</div>
                  <CalendarComponent
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => handleCustomDateChange(date, 'end')}
                    locale={es}
                  />
                  <Button
                    size="sm"
                    onClick={() => setIsCalendarOpen(false)}
                    className="mt-2"
                  >
                    Aplicar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Botones de Exportación */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportTopUsers}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Exportar Top Usuarios</span>
          <span className="sm:hidden">Top Usuarios</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportAllReservations}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Exportar Reservas</span>
          <span className="sm:hidden">Reservas</span>
        </Button>
      </div>
    </div>
  );
};
