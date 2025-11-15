/**
 * useWaitlistOffers Hook - Usage Examples
 * 
 * This file demonstrates how to use the useWaitlistOffers hook
 * for managing waitlist offers in the RESERVEO application.
 */

import { useWaitlistOffers } from './useWaitlistOffers';
import { useWaitlist } from './useWaitlist';

// ============================================================================
// Example 1: Display Pending Offers with Countdown
// ============================================================================

export const PendingOffersExample = () => {
  const { pendingOffers, isLoading, getTimeRemaining } = useWaitlistOffers();
  const { acceptOffer, rejectOffer } = useWaitlist();

  if (isLoading) {
    return <div>Cargando ofertas...</div>;
  }

  if (pendingOffers.length === 0) {
    return <div>No tienes ofertas pendientes</div>;
  }

  return (
    <div>
      <h2>Ofertas Pendientes</h2>
      {pendingOffers.map(offer => {
        const timeRemaining = getTimeRemaining(offer.expires_at);
        
        return (
          <div key={offer.id} className="offer-card">
            <h3>Plaza {offer.parking_spot?.spot_number}</h3>
            <p>Grupo: {offer.parking_group?.name}</p>
            <p>Fecha: {offer.reservation_date}</p>
            
            {/* Countdown timer */}
            <div className={timeRemaining.isExpired ? 'expired' : 'active'}>
              {timeRemaining.isExpired ? (
                <span>Oferta expirada</span>
              ) : (
                <span>Tiempo restante: {timeRemaining.formattedTime}</span>
              )}
            </div>

            {/* Action buttons */}
            {!timeRemaining.isExpired && (
              <div>
                <button onClick={() => acceptOffer(offer.id)}>
                  Aceptar
                </button>
                <button onClick={() => rejectOffer(offer.id)}>
                  Rechazar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Example 2: Offer Details Modal
// ============================================================================

export const OfferDetailsModalExample = () => {
  const { getOfferDetails, getTimeRemaining } = useWaitlistOffers();
  const [selectedOfferId, setSelectedOfferId] = React.useState<string | null>(null);
  const [offerDetails, setOfferDetails] = React.useState(null);

  const loadOfferDetails = async (offerId: string) => {
    try {
      const details = await getOfferDetails(offerId);
      setOfferDetails(details);
    } catch (error) {
      console.error('Error loading offer details:', error);
    }
  };

  React.useEffect(() => {
    if (selectedOfferId) {
      loadOfferDetails(selectedOfferId);
    }
  }, [selectedOfferId]);

  if (!offerDetails) {
    return null;
  }

  const timeRemaining = getTimeRemaining(offerDetails.expires_at);

  return (
    <div className="modal">
      <h2>Detalles de la Oferta</h2>
      
      {/* Spot information */}
      <div>
        <h3>Plaza {offerDetails.parking_spot?.spot_number}</h3>
        <p>Grupo: {offerDetails.parking_group?.name}</p>
        <p>Ubicación: {offerDetails.parking_group?.description}</p>
      </div>

      {/* Spot features */}
      <div>
        <h4>Características:</h4>
        <ul>
          {offerDetails.parking_spot?.is_accessible && (
            <li>♿ Accesible (PMR)</li>
          )}
          {offerDetails.parking_spot?.has_charger && (
            <li>🔌 Cargador eléctrico</li>
          )}
          {offerDetails.parking_spot?.is_compact && (
            <li>🚗 Plaza compacta</li>
          )}
        </ul>
      </div>

      {/* Time remaining */}
      <div>
        <h4>Tiempo para responder:</h4>
        <p className={timeRemaining.isExpired ? 'text-red-600' : 'text-green-600'}>
          {timeRemaining.formattedTime}
        </p>
        <p className="text-sm text-muted-foreground">
          Expira: {new Date(offerDetails.expires_at).toLocaleString()}
        </p>
      </div>

      {/* Waitlist entry info */}
      {offerDetails.waitlist_entry && (
        <div>
          <h4>Tu registro en lista de espera:</h4>
          <p>Posición en cola: {offerDetails.waitlist_entry.position || 'N/A'}</p>
          <p>Registrado: {new Date(offerDetails.waitlist_entry.created_at).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 3: Real-time Notification Badge
// ============================================================================

export const OfferNotificationBadgeExample = () => {
  const { pendingOffers } = useWaitlistOffers();

  // Count offers that are about to expire (less than 15 minutes)
  const urgentOffers = pendingOffers.filter(offer => {
    const timeRemaining = getTimeRemaining(offer.expires_at);
    return !timeRemaining.isExpired && timeRemaining.minutes < 15;
  });

  if (pendingOffers.length === 0) {
    return null;
  }

  return (
    <div className="notification-badge">
      <span className="badge">{pendingOffers.length}</span>
      {urgentOffers.length > 0 && (
        <span className="urgent-indicator">
          ⚠️ {urgentOffers.length} urgente{urgentOffers.length > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Example 4: Offer List with Auto-refresh
// ============================================================================

export const AutoRefreshOfferListExample = () => {
  const { pendingOffers, isLoading, getTimeRemaining } = useWaitlistOffers();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update current time every second for countdown
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h2>Mis Ofertas ({pendingOffers.length})</h2>
      
      {pendingOffers.map(offer => {
        const timeRemaining = getTimeRemaining(offer.expires_at);
        const urgency = timeRemaining.minutes < 15 ? 'urgent' : 
                       timeRemaining.minutes < 30 ? 'warning' : 'normal';

        return (
          <div key={offer.id} className={`offer-card ${urgency}`}>
            <div className="offer-header">
              <h3>Plaza {offer.parking_spot?.spot_number}</h3>
              <span className="time-badge">
                {timeRemaining.formattedTime}
              </span>
            </div>

            <div className="offer-body">
              <p>{offer.parking_group?.name}</p>
              <p>{offer.reservation_date}</p>
            </div>

            {/* Progress bar showing time remaining */}
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, (timeRemaining.minutes / 120) * 100))}%`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Example 5: Offer Comparison View
// ============================================================================

export const OfferComparisonExample = () => {
  const { pendingOffers, getTimeRemaining } = useWaitlistOffers();

  // Sort offers by time remaining (most urgent first)
  const sortedOffers = [...pendingOffers].sort((a, b) => {
    const timeA = getTimeRemaining(a.expires_at).milliseconds;
    const timeB = getTimeRemaining(b.expires_at).milliseconds;
    return timeA - timeB;
  });

  return (
    <div className="offer-comparison">
      <h2>Comparar Ofertas</h2>
      
      <table>
        <thead>
          <tr>
            <th>Plaza</th>
            <th>Grupo</th>
            <th>Fecha</th>
            <th>Características</th>
            <th>Tiempo Restante</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedOffers.map(offer => {
            const timeRemaining = getTimeRemaining(offer.expires_at);
            const features = [];
            
            if (offer.parking_spot?.is_accessible) features.push('♿');
            if (offer.parking_spot?.has_charger) features.push('🔌');
            if (offer.parking_spot?.is_compact) features.push('🚗');

            return (
              <tr key={offer.id} className={timeRemaining.isExpired ? 'expired' : ''}>
                <td>{offer.parking_spot?.spot_number}</td>
                <td>{offer.parking_group?.name}</td>
                <td>{offer.reservation_date}</td>
                <td>{features.join(' ')}</td>
                <td className={timeRemaining.minutes < 15 ? 'text-red-600' : ''}>
                  {timeRemaining.formattedTime}
                </td>
                <td>
                  {!timeRemaining.isExpired && (
                    <>
                      <button>Aceptar</button>
                      <button>Rechazar</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// Example 6: Integration with Toast Notifications
// ============================================================================

export const OfferToastNotificationExample = () => {
  const { pendingOffers } = useWaitlistOffers();
  const [notifiedOffers, setNotifiedOffers] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Show toast for new offers
    pendingOffers.forEach(offer => {
      if (!notifiedOffers.has(offer.id)) {
        // Show toast notification
        toast.info(`Nueva oferta: Plaza ${offer.parking_spot?.spot_number}`, {
          description: `Grupo: ${offer.parking_group?.name}`,
          action: {
            label: 'Ver',
            onClick: () => {
              // Navigate to offer details
              window.location.href = `/offers/${offer.id}`;
            }
          }
        });

        // Mark as notified
        setNotifiedOffers(prev => new Set(prev).add(offer.id));
      }
    });

    // Clean up notified offers that are no longer pending
    const currentOfferIds = new Set(pendingOffers.map(o => o.id));
    setNotifiedOffers(prev => {
      const updated = new Set(prev);
      prev.forEach(id => {
        if (!currentOfferIds.has(id)) {
          updated.delete(id);
        }
      });
      return updated;
    });
  }, [pendingOffers, notifiedOffers]);

  return null; // This is a notification-only component
};

// ============================================================================
// Helper function used in examples
// ============================================================================

function getTimeRemaining(expiresAt: string) {
  const now = new Date();
  const expiryDate = new Date(expiresAt);
  const diffMs = expiryDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      milliseconds: 0,
      seconds: 0,
      minutes: 0,
      hours: 0,
      isExpired: true,
      formattedTime: 'Expirado'
    };
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  let formattedTime = '';
  if (hours > 0) {
    formattedTime = `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    formattedTime = `${minutes}m ${seconds % 60}s`;
  } else {
    formattedTime = `${seconds}s`;
  }

  return {
    milliseconds: diffMs,
    seconds,
    minutes,
    hours,
    isExpired: false,
    formattedTime
  };
}
