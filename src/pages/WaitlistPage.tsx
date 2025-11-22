import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WaitlistDashboard } from '@/components/waitlist/WaitlistDashboard';
import { WaitlistOfferNotification } from '@/components/waitlist/WaitlistOfferNotification';
import { useWaitlistOffers } from '@/hooks/useWaitlistOffers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { WaitlistOfferWithDetails } from '@/types/waitlist';

/**
 * WaitlistPage Component
 * 
 * Main page for managing user's waitlist entries and offers.
 * 
 * Features:
 * - Active waitlist entries dashboard
 * - Pending offers highlighted section
 * - Offer history (accepted/rejected/expired)
 * - Modal for accepting/rejecting offers
 * - Real-time updates
 * 
 * Requirements: 4.1, 6.1
 */
const WaitlistPage = () => {
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId?: string }>();
  const { pendingOffers, isLoading: offersLoading } = useWaitlistOffers();
  const [selectedOffer, setSelectedOffer] = useState<WaitlistOfferWithDetails | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  // Fetch offer history (accepted, rejected, expired)
  const {
    data: offerHistory = [],
    isLoading: historyLoading
  } = useQuery({
    queryKey: ['offer-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('waitlist_offers')
        .select(`
          *,
          parking_spot:parking_spots(
            id,
            spot_number
          ),
          parking_group:parking_spots!inner(
            group_id,
            parking_groups(
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['accepted', 'rejected', 'expired'])
        .order('responded_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transform data
      return (data || []).map(offer => {
        const spotData = offer.parking_spot as any;
        const groupData = (offer as any).parking_group?.[0]?.parking_groups;

        return {
          ...offer,
          parking_spot: spotData,
          parking_group: groupData
        } as WaitlistOfferWithDetails;
      });
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Auto-open dialog for specific offer from URL or first pending offer
  useEffect(() => {
    if (pendingOffers.length === 0) return;

    // If offerId in URL, find and open that specific offer
    if (offerId) {
      const offer = pendingOffers.find(o => o.id === offerId);
      if (offer) {
        setSelectedOffer(offer);
        setOfferDialogOpen(true);
        // Clean URL after opening
        navigate('/waitlist', { replace: true });
      }
      return;
    }

    // Otherwise, auto-open first pending offer if none selected
    if (!selectedOffer) {
      setSelectedOffer(pendingOffers[0]);
      setOfferDialogOpen(true);
    }
  }, [pendingOffers, selectedOffer, offerId, navigate]);

  /**
   * Handle opening offer dialog
   */
  const handleOpenOffer = (offer: WaitlistOfferWithDetails) => {
    setSelectedOffer(offer);
    setOfferDialogOpen(true);
  };

  /**
   * Handle closing offer dialog
   */
  const handleCloseOffer = () => {
    setOfferDialogOpen(false);
    // Don't clear selectedOffer immediately to allow animation
    setTimeout(() => setSelectedOffer(null), 300);
  };

  /**
   * Get status badge for offer
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aceptada
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazada
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expirada
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Lista de Espera
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestiona tus registros y ofertas de plazas
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Pending Offers Section - Highlighted */}
          {pendingOffers.length > 0 && (
            <Card className="border-2 border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <AlertCircle className="h-5 w-5" />
                  Ofertas Pendientes
                </CardTitle>
                <CardDescription>
                  Tienes {pendingOffers.length} oferta{pendingOffers.length !== 1 ? 's' : ''} esperando tu respuesta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingOffers.map((offer) => (
                    <Card
                      key={offer.id}
                      className="border-2 border-primary cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => handleOpenOffer(offer)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="bg-amber-600">
                                ⏰ Urgente
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Plaza {offer.parking_spot?.spot_number}
                              </span>
                            </div>
                            <p className="font-semibold">
                              {offer.parking_group?.name}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {format(new Date(offer.reservation_date), "EEEE, d 'de' MMMM", { locale: es })}
                            </p>
                          </div>
                          <Button size="sm">
                            Ver Oferta
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for Active Entries and History */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Listas Activas
              </TabsTrigger>
              <TabsTrigger value="history">
                Historial
              </TabsTrigger>
            </TabsList>

            {/* Active Waitlist Entries */}
            <TabsContent value="active" className="space-y-6">
              <WaitlistDashboard />
            </TabsContent>

            {/* Offer History */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Historial de Ofertas
                  </CardTitle>
                  <CardDescription>
                    Ofertas recibidas anteriormente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : offerHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Inbox className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Sin historial
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Aún no has recibido ofertas de plazas. Cuando recibas y respondas ofertas, 
                        aparecerán aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {offerHistory.map((offer) => (
                        <Card key={offer.id} className="border">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getStatusBadge(offer.status)}
                                  <span className="text-sm text-muted-foreground">
                                    Plaza {offer.parking_spot?.spot_number}
                                  </span>
                                </div>
                                
                                <p className="font-semibold">
                                  {offer.parking_group?.name}
                                </p>
                                
                                <p className="text-sm text-muted-foreground capitalize">
                                  {format(new Date(offer.reservation_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                                </p>

                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p>
                                    Oferta recibida: {format(new Date(offer.created_at), "d/MM/yyyy 'a las' HH:mm", { locale: es })}
                                  </p>
                                  {offer.responded_at && (
                                    <p>
                                      Respondida: {format(new Date(offer.responded_at), "d/MM/yyyy 'a las' HH:mm", { locale: es })}
                                    </p>
                                  )}
                                  {!offer.responded_at && offer.status === 'expired' && (
                                    <p>
                                      Expiró: {format(new Date(offer.expires_at), "d/MM/yyyy 'a las' HH:mm", { locale: es })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {offerHistory.length > 0 && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Se muestran las últimas 20 ofertas. Las ofertas más antiguas se archivan automáticamente.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Offer Dialog */}
      {selectedOffer && (
        <WaitlistOfferNotification
          offer={selectedOffer}
          open={offerDialogOpen}
          onOpenChange={handleCloseOffer}
        />
      )}
    </div>
  );
};

export default WaitlistPage;
