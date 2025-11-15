/**
 * useWaitlist Hook - Usage Examples
 * 
 * This file demonstrates how to use the useWaitlist hook for managing
 * waitlist operations in the RESERVEO application.
 */

import { useEffect, useState } from 'react';
import { useWaitlist } from './useWaitlist';
import type { WaitlistEntry } from '@/types/waitlist';

// ============================================================================
// Example 1: Register in Waitlist
// ============================================================================

export const WaitlistRegistrationExample = () => {
  const { registerInWaitlist, isLoading } = useWaitlist();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleRegister = async () => {
    try {
      await registerInWaitlist(selectedGroups, selectedDate);
      // Success toast is shown automatically
      // UI will update automatically via query invalidation
    } catch (error) {
      // Error toast is shown automatically
      console.error('Registration failed:', error);
    }
  };

  return (
    <div>
      {/* Group selection UI */}
      {/* Date selection UI */}
      <button onClick={handleRegister} disabled={isLoading}>
        {isLoading ? 'Registrando...' : 'Registrarse en Lista de Espera'}
      </button>
    </div>
  );
};

// ============================================================================
// Example 2: Display User's Waitlist Entries
// ============================================================================

export const WaitlistDashboardExample = () => {
  const { getUserWaitlistEntries, cancelWaitlistEntry, isLoading } = useWaitlist();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await getUserWaitlistEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const handleCancel = async (entryId: string) => {
    try {
      await cancelWaitlistEntry(entryId);
      // Reload entries after cancellation
      await loadEntries();
    } catch (error) {
      console.error('Cancellation failed:', error);
    }
  };

  return (
    <div>
      <h2>Mis Listas de Espera</h2>
      {isLoading ? (
        <p>Cargando...</p>
      ) : entries.length === 0 ? (
        <p>No estás en ninguna lista de espera</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              <div>
                <strong>{entry.parking_group?.name}</strong>
                <p>Fecha: {entry.reservation_date}</p>
                <p>Estado: {entry.status}</p>
                <p>Posición: {entry.position || 'Calculando...'}</p>
              </div>
              <button 
                onClick={() => handleCancel(entry.id)}
                disabled={isLoading}
              >
                Cancelar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ============================================================================
// Example 3: Accept Waitlist Offer
// ============================================================================

export const AcceptOfferExample = () => {
  const { acceptOffer, isLoading } = useWaitlist();
  const offerId = 'offer-uuid-here';

  const handleAccept = async () => {
    try {
      const reservationId = await acceptOffer(offerId);
      console.log('Reservation created:', reservationId);
      // Success toast is shown automatically
      // User is removed from all waitlists automatically
      // Navigate to reservations page or show confirmation
    } catch (error) {
      // Error toast is shown automatically
      console.error('Accept failed:', error);
    }
  };

  return (
    <div>
      <h3>Oferta de Plaza Disponible</h3>
      <p>Tienes una plaza disponible. ¿Deseas aceptarla?</p>
      <button onClick={handleAccept} disabled={isLoading}>
        {isLoading ? 'Aceptando...' : 'Aceptar Oferta'}
      </button>
    </div>
  );
};

// ============================================================================
// Example 4: Reject Waitlist Offer
// ============================================================================

export const RejectOfferExample = () => {
  const { rejectOffer, isLoading } = useWaitlist();
  const offerId = 'offer-uuid-here';

  const handleReject = async () => {
    try {
      await rejectOffer(offerId);
      // Info toast is shown automatically
      // User stays in waitlist
      // Next user in queue will be processed
    } catch (error) {
      // Error toast is shown automatically
      console.error('Reject failed:', error);
    }
  };

  return (
    <div>
      <h3>Oferta de Plaza Disponible</h3>
      <p>¿Deseas rechazar esta oferta?</p>
      <button onClick={handleReject} disabled={isLoading}>
        {isLoading ? 'Rechazando...' : 'Rechazar Oferta'}
      </button>
    </div>
  );
};

// ============================================================================
// Example 5: Complete Offer Response Component
// ============================================================================

export const OfferResponseExample = () => {
  const { acceptOffer, rejectOffer, isLoading } = useWaitlist();
  const [offer, setOffer] = useState({
    id: 'offer-uuid',
    spotNumber: 'A-15',
    groupName: 'Planta -1',
    date: '2025-11-20',
    expiresAt: '2025-11-20T14:00:00Z'
  });

  const handleAccept = async () => {
    try {
      await acceptOffer(offer.id);
      // Navigate to reservations or close modal
    } catch (error) {
      // Error is handled automatically
    }
  };

  const handleReject = async () => {
    try {
      await rejectOffer(offer.id);
      // Close modal or update UI
    } catch (error) {
      // Error is handled automatically
    }
  };

  return (
    <div className="offer-modal">
      <h2>¡Plaza Disponible!</h2>
      <div className="offer-details">
        <p><strong>Plaza:</strong> {offer.spotNumber}</p>
        <p><strong>Grupo:</strong> {offer.groupName}</p>
        <p><strong>Fecha:</strong> {offer.date}</p>
        <p><strong>Expira:</strong> {new Date(offer.expiresAt).toLocaleString()}</p>
      </div>
      <div className="offer-actions">
        <button 
          onClick={handleAccept} 
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Procesando...' : 'Aceptar'}
        </button>
        <button 
          onClick={handleReject} 
          disabled={isLoading}
          className="btn-secondary"
        >
          {isLoading ? 'Procesando...' : 'Rechazar'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Example 6: Register Multiple Groups with Error Handling
// ============================================================================

export const MultiGroupRegistrationExample = () => {
  const { registerInWaitlist, isLoading, error } = useWaitlist();
  const [allGroups] = useState([
    { id: 'group-1', name: 'Planta -1' },
    { id: 'group-2', name: 'Planta -2' },
    { id: 'group-3', name: 'Zona Norte' }
  ]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [date, setDate] = useState('2025-11-20');

  const handleSelectAll = () => {
    setSelectedGroups(allGroups.map(g => g.id));
  };

  const handleRegister = async () => {
    if (selectedGroups.length === 0) {
      alert('Selecciona al menos un grupo');
      return;
    }

    try {
      await registerInWaitlist(selectedGroups, date);
      // Success - reset form
      setSelectedGroups([]);
    } catch (error) {
      // Error is handled automatically with toast
      // Can add additional error handling here if needed
    }
  };

  return (
    <div>
      <h2>Registrarse en Lista de Espera</h2>
      
      <div className="date-selector">
        <label>Fecha:</label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="group-selector">
        <h3>Selecciona Grupos:</h3>
        <button onClick={handleSelectAll}>Seleccionar Todos</button>
        {allGroups.map((group) => (
          <label key={group.id}>
            <input
              type="checkbox"
              checked={selectedGroups.includes(group.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedGroups([...selectedGroups, group.id]);
                } else {
                  setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                }
              }}
            />
            {group.name}
          </label>
        ))}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button 
        onClick={handleRegister} 
        disabled={isLoading || selectedGroups.length === 0}
      >
        {isLoading ? 'Registrando...' : `Registrarse en ${selectedGroups.length} grupo(s)`}
      </button>
    </div>
  );
};

// ============================================================================
// Example 7: Using with React Query
// ============================================================================

import { useQuery } from '@tanstack/react-query';

export const WaitlistWithReactQueryExample = () => {
  const { getUserWaitlistEntries, cancelWaitlistEntry } = useWaitlist();

  // Use React Query for automatic caching and refetching
  const { 
    data: entries, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['user-waitlist-entries'],
    queryFn: getUserWaitlistEntries,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleCancel = async (entryId: string) => {
    try {
      await cancelWaitlistEntry(entryId);
      // React Query will automatically refetch due to invalidation
    } catch (error) {
      console.error('Cancellation failed:', error);
    }
  };

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Mis Listas de Espera</h2>
      <button onClick={() => refetch()}>Actualizar</button>
      {entries?.length === 0 ? (
        <p>No estás en ninguna lista de espera</p>
      ) : (
        <ul>
          {entries?.map((entry) => (
            <li key={entry.id}>
              {/* Entry details */}
              <button onClick={() => handleCancel(entry.id)}>
                Cancelar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ============================================================================
// Notes and Best Practices
// ============================================================================

/**
 * BEST PRACTICES:
 * 
 * 1. Error Handling:
 *    - All functions show toast notifications automatically
 *    - Errors are logged to console
 *    - You can catch errors for additional handling
 * 
 * 2. Loading States:
 *    - Always check isLoading before showing UI
 *    - Disable buttons during operations
 *    - Show loading indicators
 * 
 * 3. Query Invalidation:
 *    - All mutations automatically invalidate relevant queries
 *    - UI updates automatically via React Query
 *    - No need to manually refetch in most cases
 * 
 * 4. User Feedback:
 *    - Success: Green toast with confirmation
 *    - Error: Red toast with error message
 *    - Info: Blue toast for informational messages
 * 
 * 5. Multiple Groups:
 *    - registerInWaitlist accepts array of group IDs
 *    - Partial success is handled gracefully
 *    - Failed registrations are logged
 * 
 * 6. Offer Acceptance:
 *    - Returns reservation ID on success
 *    - Removes user from ALL waitlists
 *    - Creates confirmed reservation
 * 
 * 7. Offer Rejection:
 *    - Keeps user in waitlist
 *    - May apply penalty if enabled
 *    - Processes next user in queue automatically
 */
