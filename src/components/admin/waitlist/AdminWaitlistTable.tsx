import { useState, useEffect } from "react";
import { useAdminWaitlist } from "@/hooks/admin/useAdminWaitlist";
import { useParkingGroups } from "@/hooks/admin/useParkingGroups";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Download, Calendar, Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { WaitlistEntryWithDetails } from "@/types/waitlist";

/**
 * AdminWaitlistTable Component
 * 
 * Displays a filterable table of waitlist entries with management capabilities.
 * 
 * Features:
 * - Filter by parking group and date
 * - Display user, position, and time in waitlist
 * - Manual entry removal with confirmation
 * - Pagination for large datasets
 * - Export to CSV
 * - Real-time position calculation
 * 
 * Requirements: 10.5, 10.6
 * 
 * @example
 * ```tsx
 * <AdminWaitlistTable />
 * ```
 */
export const AdminWaitlistTable = () => {
  const { entries, loading, getWaitlistByGroup, removeWaitlistEntry, canModify } = useAdminWaitlist();
  const { parkingGroups, loadParkingGroups } = useParkingGroups();

  // Filters
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Delete confirmation
  const [entryToDelete, setEntryToDelete] = useState<WaitlistEntryWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load groups on mount
  useEffect(() => {
    loadParkingGroups();
  }, []);

  // Load entries when filters change
  useEffect(() => {
    if (selectedGroupId && selectedDate) {
      getWaitlistByGroup(selectedGroupId, selectedDate);
      setCurrentPage(1); // Reset to first page
    }
  }, [selectedGroupId, selectedDate]);

  // Filter entries by search term
  const filteredEntries = entries.filter((entry) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const userName = entry.user?.full_name?.toLowerCase() || "";
    const userEmail = entry.user?.email?.toLowerCase() || "";
    
    return userName.includes(searchLower) || userEmail.includes(searchLower);
  });

  // Paginate entries
  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

  // Calculate position for each entry (1-indexed)
  const entriesWithPosition = paginatedEntries.map((entry, index) => ({
    ...entry,
    position: startIndex + index + 1,
  }));

  /**
   * Handle entry deletion
   */
  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    const success = await removeWaitlistEntry(entryToDelete.id);
    setIsDeleting(false);

    if (success) {
      setEntryToDelete(null);
      // Reload entries
      if (selectedGroupId && selectedDate) {
        await getWaitlistByGroup(selectedGroupId, selectedDate, true);
      }
    }
  };

  /**
   * Export entries to CSV
   */
  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      return;
    }

    const headers = [
      "Posición",
      "Usuario",
      "Email",
      "Grupo",
      "Fecha Reserva",
      "Tiempo en Espera",
      "Fecha Registro",
    ];

    const rows = filteredEntries.map((entry, index) => [
      (index + 1).toString(),
      entry.user?.full_name || "N/A",
      entry.user?.email || "N/A",
      entry.parking_group?.name || "N/A",
      entry.reservation_date,
      formatDistanceToNow(new Date(entry.created_at), { locale: es, addSuffix: false }),
      new Date(entry.created_at).toLocaleString("es-ES"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `waitlist_${selectedGroupId}_${selectedDate}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Get time in waitlist formatted
   */
  const getTimeInWaitlist = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      locale: es,
      addSuffix: false,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Espera por Grupo</CardTitle>
          <CardDescription>
            Visualiza y gestiona las entradas de lista de espera para un grupo y fecha específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Group Filter */}
            <div className="space-y-2">
              <Label htmlFor="group-filter">Grupo de Parking</Label>
              <Select
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
              >
                <SelectTrigger id="group-filter">
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {parkingGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="date-filter">Fecha</Label>
              <Input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar Usuario</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          {selectedGroupId && selectedDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{filteredEntries.length} usuarios</span>
                </div>
                {filteredEntries.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedDate).toLocaleDateString("es-ES")}</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={filteredEntries.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          )}

          {/* Table */}
          {loading && !entries.length ? (
            <TableLoadingSkeleton />
          ) : !selectedGroupId || !selectedDate ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Selecciona un grupo y fecha</p>
              <p className="text-sm text-muted-foreground mt-1">
                Elige un grupo de parking y una fecha para ver la lista de espera
              </p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay usuarios en espera</p>
              <p className="text-sm text-muted-foreground mt-1">
                No hay entradas activas para este grupo y fecha
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Posición</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tiempo en Espera</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-24 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entriesWithPosition.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            #{entry.position}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.user?.full_name || "Usuario desconocido"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.user?.email || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {getTimeInWaitlist(entry.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={entry.status === "active" ? "default" : "secondary"}
                          >
                            {entry.status === "active" ? "Activo" : entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEntryToDelete(entry)}
                            disabled={!canModify}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredEntries.length)} de{" "}
                    {filteredEntries.length} entradas
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrada de lista de espera?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la entrada de{" "}
              <span className="font-semibold text-foreground">
                {entryToDelete?.user?.full_name}
              </span>{" "}
              de la lista de espera.
              <br />
              <br />
              Esta acción no se puede deshacer. El usuario será removido de la lista y deberá
              registrarse nuevamente si desea volver a entrar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/**
 * Loading Skeleton for Table
 */
const TableLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Posición</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tiempo en Espera</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-24 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-6 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-8 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
