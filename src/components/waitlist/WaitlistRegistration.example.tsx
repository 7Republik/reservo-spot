import { useState } from 'react';
import { WaitlistRegistration } from './WaitlistRegistration';

/**
 * Example usage of WaitlistRegistration component
 * 
 * This component should be shown when:
 * 1. User tries to make a reservation
 * 2. No parking spots are available for the selected date
 * 3. Waitlist system is enabled
 */

export const WaitlistRegistrationExample = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);

  // Example: User's available parking groups
  const userGroups = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Planta -1',
      location: 'Edificio Principal'
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Planta -2',
      location: 'Edificio Principal'
    },
    {
      id: '323e4567-e89b-12d3-a456-426614174002',
      name: 'Zona Norte',
      location: 'Parking Exterior'
    }
  ];

  // Example: Selected date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const handleSuccess = () => {
    console.log('Successfully registered in waitlist!');
    setShowWaitlist(false);
    // Navigate to waitlist dashboard or show confirmation
  };

  const handleCancel = () => {
    console.log('User cancelled waitlist registration');
    setShowWaitlist(false);
    // Navigate back to calendar or previous screen
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ejemplo de Lista de Espera</h1>
      
      {!showWaitlist ? (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Simula el flujo cuando no hay plazas disponibles:
          </p>
          <button
            onClick={() => setShowWaitlist(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Mostrar registro en lista de espera
          </button>
        </div>
      ) : (
        <WaitlistRegistration
          date={tomorrow}
          availableGroups={userGroups}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

/**
 * Integration example in reservation flow:
 * 
 * ```tsx
 * const ReservationFlow = () => {
 *   const [availableSpots, setAvailableSpots] = useState([]);
 *   const [showWaitlist, setShowWaitlist] = useState(false);
 *   const { settings } = useWaitlistSettings();
 * 
 *   useEffect(() => {
 *     // Check availability
 *     const checkAvailability = async () => {
 *       const spots = await getAvailableSpots(selectedDate, selectedGroup);
 *       
 *       if (spots.length === 0 && settings.waitlist_enabled) {
 *         // No spots available, show waitlist option
 *         setShowWaitlist(true);
 *       } else {
 *         setAvailableSpots(spots);
 *       }
 *     };
 * 
 *     checkAvailability();
 *   }, [selectedDate, selectedGroup]);
 * 
 *   if (showWaitlist) {
 *     return (
 *       <WaitlistRegistration
 *         date={selectedDate}
 *         availableGroups={userGroups}
 *         onSuccess={() => {
 *           // Navigate to waitlist dashboard
 *           navigate('/waitlist');
 *         }}
 *         onCancel={() => {
 *           // Go back to calendar
 *           navigate('/calendar');
 *         }}
 *       />
 *     );
 *   }
 * 
 *   return (
 *     <SpotSelection
 *       spots={availableSpots}
 *       onSelect={handleSpotSelection}
 *     />
 *   );
 * };
 * ```
 */

/**
 * Modal integration example:
 * 
 * ```tsx
 * const ReservationModal = () => {
 *   const [showWaitlist, setShowWaitlist] = useState(false);
 * 
 *   return (
 *     <Dialog open={isOpen} onOpenChange={setIsOpen}>
 *       <DialogContent className="max-w-2xl">
 *         {showWaitlist ? (
 *           <WaitlistRegistration
 *             date={selectedDate}
 *             availableGroups={userGroups}
 *             onSuccess={() => {
 *               setIsOpen(false);
 *               toast.success('Registrado en lista de espera');
 *             }}
 *             onCancel={() => setShowWaitlist(false)}
 *           />
 *         ) : (
 *           <SpotSelection ... />
 *         )}
 *       </DialogContent>
 *     </Dialog>
 *   );
 * };
 * ```
 */
