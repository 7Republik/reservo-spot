import { useState } from 'react';
import { WaitlistOfferNotification } from './WaitlistOfferNotification';
import { Button } from '@/components/ui/button';
import type { WaitlistOfferWithDetails } from '@/types/waitlist';

/**
 * Example usage of WaitlistOfferNotification component
 * 
 * This example demonstrates:
 * - Opening the notification dialog
 * - Displaying offer details
 * - Handling accept/reject actions
 * - Auto-closing after action
 */
export const WaitlistOfferNotificationExample = () => {
  const [open, setOpen] = useState(false);

  // Mock offer data
  const mockOffer: WaitlistOfferWithDetails = {
    id: 'offer-123',
    entry_id: 'entry-456',
    user_id: 'user-789',
    spot_id: 'spot-abc',
    reservation_date: '2025-11-20',
    status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes from now
    responded_at: null,
    parking_spot: {
      id: 'spot-abc',
      spot_number: 'A-15',
      group_id: 'group-xyz',
      is_accessible: true,
      has_charger: false,
      is_compact: false
    },
    parking_group: {
      id: 'group-xyz',
      name: 'Planta -1',
      location: 'Edificio Principal'
    }
  };

  // Mock offer with less time (critical)
  const mockOfferCritical: WaitlistOfferWithDetails = {
    ...mockOffer,
    id: 'offer-critical',
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    parking_spot: {
      ...mockOffer.parking_spot!,
      spot_number: 'B-23',
      has_charger: true
    }
  };

  // Mock expired offer
  const mockOfferExpired: WaitlistOfferWithDetails = {
    ...mockOffer,
    id: 'offer-expired',
    expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    parking_spot: {
      ...mockOffer.parking_spot!,
      spot_number: 'C-08'
    }
  };

  const [currentOffer, setCurrentOffer] = useState(mockOffer);

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">WaitlistOfferNotification Examples</h2>
      
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Click the buttons below to see different states of the offer notification:
        </p>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setCurrentOffer(mockOffer);
              setOpen(true);
            }}
          >
            Normal Offer (45 min)
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => {
              setCurrentOffer(mockOfferCritical);
              setOpen(true);
            }}
          >
            Critical Offer (10 min)
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setCurrentOffer(mockOfferExpired);
              setOpen(true);
            }}
          >
            Expired Offer
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Visual countdown timer with color-coded urgency</li>
          <li>Spot details: number, group, date</li>
          <li>Spot features badges (accessible, charger, compact)</li>
          <li>Accept and Reject buttons</li>
          <li>Buttons disabled when offer expires</li>
          <li>Confirmation screen after action</li>
          <li>Auto-closes 2 seconds after successful action</li>
          <li>Real-time countdown updates every second</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
          Integration Example:
        </h3>
        <pre className="text-xs overflow-x-auto">
{`import { useWaitlistOffers } from '@/hooks/useWaitlistOffers';
import { WaitlistOfferNotification } from '@/components/waitlist/WaitlistOfferNotification';

function MyComponent() {
  const { pendingOffers } = useWaitlistOffers();
  const [selectedOffer, setSelectedOffer] = useState(null);

  return (
    <>
      {pendingOffers.map(offer => (
        <button
          key={offer.id}
          onClick={() => setSelectedOffer(offer)}
        >
          View Offer
        </button>
      ))}

      {selectedOffer && (
        <WaitlistOfferNotification
          offer={selectedOffer}
          open={!!selectedOffer}
          onOpenChange={(open) => !open && setSelectedOffer(null)}
        />
      )}
    </>
  );
}`}
        </pre>
      </div>

      {/* The actual notification dialog */}
      <WaitlistOfferNotification
        offer={currentOffer}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
};
