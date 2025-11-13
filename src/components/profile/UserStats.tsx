import { 
  Calendar, 
  CalendarCheck, 
  Clock, 
  Car, 
  AlertTriangle, 
  UserCheck 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStats } from "@/hooks/useUserStats";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * UserStats component
 * 
 * Displays user statistics in a responsive grid layout.
 * Features:
 * - Responsive grid (2 columns mobile, 3-4 desktop)
 * - Statistics: total reservations, active reservations, last reservation,
 *   license plates, warnings, member since
 * - Appropriate icons for each stat
 * - Loading skeleton states
 * - Color coding for warnings (green/yellow/red)
 * - Accessible with ARIA labels
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
const UserStats = () => {
  const { stats, isLoading } = useUserStats();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" role="status" aria-label="Cargando estadísticas">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
        <span className="sr-only">Cargando estadísticas del usuario</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground" role="alert">
        No se pudieron cargar las estadísticas
      </div>
    );
  }

  // Format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return "Fecha inválida";
    }
  };

  const formatMemberSince = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM yyyy", { locale: es });
    } catch {
      return "Fecha inválida";
    }
  };

  // Determine warning color
  const getWarningColor = (count: number) => {
    if (count === 0) {
      return "text-green-600 dark:text-green-400";
    } else if (count <= 2) {
      return "text-yellow-600 dark:text-yellow-400";
    } else {
      return "text-red-600 dark:text-red-400";
    }
  };

  // Stat card data
  const statCards = [
    {
      icon: Calendar,
      value: stats.total_reservations,
      label: "Total Reservas",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      icon: Clock,
      value: stats.active_reservations,
      label: "Reservas Activas",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
    {
      icon: CalendarCheck,
      value: formatDate(stats.last_reservation_date),
      label: "Última Reserva",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-950",
      isDate: true,
    },
    {
      icon: Car,
      value: stats.approved_license_plates,
      label: "Matrículas Aprobadas",
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-100 dark:bg-teal-950",
    },
    {
      icon: AlertTriangle,
      value: stats.total_warnings,
      label: "Total Amonestaciones",
      color: getWarningColor(stats.total_warnings),
      bgColor: stats.total_warnings === 0 
        ? "bg-green-100 dark:bg-green-950"
        : stats.total_warnings <= 2
        ? "bg-yellow-100 dark:bg-yellow-950"
        : "bg-red-100 dark:bg-red-950",
    },
    {
      icon: UserCheck,
      value: formatMemberSince(stats.member_since),
      label: "Miembro Desde",
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-950",
      isDate: true,
    },
  ];

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
      role="region"
      aria-label="Estadísticas del usuario"
    >
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {/* Icon */}
                <div 
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
                    stat.bgColor
                  )}
                >
                  <Icon 
                    className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} 
                    aria-hidden="true"
                  />
                </div>

                {/* Value */}
                <div 
                  className={cn(
                    "font-bold tabular-nums break-words",
                    stat.isDate ? "text-base sm:text-lg" : "text-2xl sm:text-3xl",
                    stat.color
                  )}
                  aria-label={`${stat.label}: ${stat.value}`}
                >
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UserStats;
