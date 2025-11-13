import { useState, useMemo } from 'react';
import { Filter, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { WarningCard } from './WarningCard';
import { UserWarningWithDetails } from '@/types/profile';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WarningsListProps {
  warnings: UserWarningWithDetails[];
  isLoading: boolean;
  onWarningClick?: (warningId: string) => void;
}

type FilterType = 'all' | 'viewed' | 'unviewed';

const ITEMS_PER_PAGE = 10;

export const WarningsList = ({
  warnings,
  isLoading,
  onWarningClick,
}: WarningsListProps) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter warnings based on selected filter
  const filteredWarnings = useMemo(() => {
    switch (filter) {
      case 'viewed':
        return warnings.filter((w) => w.viewed_at !== null);
      case 'unviewed':
        return warnings.filter((w) => w.viewed_at === null);
      default:
        return warnings;
    }
  }, [warnings, filter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredWarnings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWarnings = filteredWarnings.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: FilterType) => {
    setFilter(value);
    setCurrentPage(1);
  };

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (warnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center" role="status">
        <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 sm:p-4 mb-3 sm:mb-4">
          <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Sin amonestaciones</h3>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md">
          ¡Excelente! No tienes ninguna amonestación registrada. Sigue
          respetando las normas de estacionamiento.
        </p>
      </div>
    );
  }

  // Empty filtered state
  if (filteredWarnings.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-40 sm:w-48 min-h-[44px] text-sm sm:text-base" aria-label="Filtrar amonestaciones">
                <SelectValue placeholder="Filtrar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unviewed">No vistas</SelectItem>
                <SelectItem value="viewed">Vistas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty filtered state */}
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center" role="status">
          <p className="text-sm sm:text-base text-muted-foreground">
            No hay amonestaciones{' '}
            {filter === 'viewed' ? 'vistas' : 'no vistas'}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-40 sm:w-48 min-h-[44px] text-sm sm:text-base" aria-label="Filtrar amonestaciones">
              <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="unviewed">No vistas</SelectItem>
              <SelectItem value="viewed">Vistas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground" role="status" aria-live="polite">
          {filteredWarnings.length}{' '}
          {filteredWarnings.length === 1 ? 'amonestación' : 'amonestaciones'}
        </span>
      </div>

      {/* Warnings List */}
      <div className="space-y-3 sm:space-y-4" role="list" aria-label="Lista de amonestaciones">
        {paginatedWarnings.map((warning) => (
          <div key={warning.id} role="listitem">
            <WarningCard
              warning={warning}
              onClick={() => onWarningClick?.(warning.id)}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav 
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border"
          aria-label="Paginación de amonestaciones"
        >
          <div className="text-xs sm:text-sm text-muted-foreground" role="status" aria-live="polite">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              aria-label="Ir a página anterior"
              className="min-h-[44px] text-xs sm:text-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
              <span>Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              aria-label="Ir a página siguiente"
              className="min-h-[44px] text-xs sm:text-sm"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
};
