import { useState } from 'react';
import { Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TopUserData } from '@/types/admin/check-in-stats';

interface TopUsersTableProps {
  users: TopUserData[];
  isLoading?: boolean;
}

type SortField = 'percentage' | 'fastReservations' | 'totalReservations' | 'avgMinutes';
type SortDirection = 'asc' | 'desc';

export const TopUsersTable = ({ users, isLoading = false }: TopUsersTableProps) => {
  const [showAll, setShowAll] = useState(false);
  const [sortField, setSortField] = useState<SortField>('percentage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'percentage':
        return (a.percentage - b.percentage) * multiplier;
      case 'fastReservations':
        return (a.fastReservations - b.fastReservations) * multiplier;
      case 'totalReservations':
        return (a.totalReservations - b.totalReservations) * multiplier;
      case 'avgMinutes':
        const aMin = a.avgMinutes || 999;
        const bMin = b.avgMinutes || 999;
        return (aMin - bMin) * multiplier;
      default:
        return 0;
    }
  });

  const displayedUsers = showAll ? sortedUsers : sortedUsers.slice(0, 10);

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return 'N/A';
    
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes % 1) * 60);
    
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Usuarios Más Rápidos</CardTitle>
        <CardDescription>
          Usuarios que reservan inmediatamente después del desbloqueo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos para el periodo seleccionado
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('fastReservations')}
                    >
                      Rápidas
                      <SortIcon field="fastReservations" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('totalReservations')}
                    >
                      Total
                      <SortIcon field="totalReservations" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('percentage')}
                    >
                      % Rápidas
                      <SortIcon field="percentage" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('avgMinutes')}
                    >
                      Tiempo Promedio
                      <SortIcon field="avgMinutes" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedUsers.map((user, index) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.fullName}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.fastReservations}</TableCell>
                      <TableCell>{user.totalReservations}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user.percentage.toFixed(1)}%
                          </span>
                          {user.isPowerUser && (
                            <Badge
                              variant="destructive"
                              className="gap-1"
                            >
                              <Flame className="h-3 w-3" />
                              Power User
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatTime(user.avgMinutes)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {users.length > 10 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Ver menos' : `Ver todos (${users.length})`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
