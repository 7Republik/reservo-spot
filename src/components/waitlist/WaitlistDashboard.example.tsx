/**
 * WaitlistDashboard - Example Usage
 * 
 * This file demonstrates how to use the WaitlistDashboard component
 * in different scenarios.
 */

import { WaitlistDashboard } from './WaitlistDashboard';

// ============================================================================
// Example 1: Standalone Page
// ============================================================================

/**
 * Use WaitlistDashboard as a standalone page for managing waitlists
 */
export const WaitlistPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Listas de Espera</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus registros en listas de espera y ve tu posición en cada cola
          </p>
        </div>
        
        <WaitlistDashboard />
      </div>
    </div>
  );
};

// ============================================================================
// Example 2: Dashboard Section
// ============================================================================

/**
 * Include WaitlistDashboard as part of a larger dashboard
 */
export const UserDashboard = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Other dashboard sections */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Mis Reservas</h2>
          {/* Reservations component */}
        </div>

        {/* Waitlist section */}
        <div>
          <WaitlistDashboard />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Example 3: Profile Section
// ============================================================================

/**
 * Include WaitlistDashboard in user profile
 */
export const UserProfile = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile info */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Mi Perfil</h2>
          {/* Profile details */}
        </section>

        {/* Waitlist section */}
        <section>
          <WaitlistDashboard />
        </section>

        {/* Other sections */}
      </div>
    </div>
  );
};

// ============================================================================
// Example 4: With Navigation
// ============================================================================

/**
 * WaitlistDashboard with navigation to other sections
 */
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';

export const WaitlistPageWithNav = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Listas de Espera</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tus registros en listas de espera
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/calendar')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Ver Calendario
            </Button>
            <Button
              onClick={() => navigate('/reserve')}
            >
              <Clock className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Button>
          </div>
        </div>

        {/* Dashboard */}
        <WaitlistDashboard />
      </div>
    </div>
  );
};

// ============================================================================
// Example 5: With Tabs
// ============================================================================

/**
 * WaitlistDashboard as part of a tabbed interface
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ReservationsAndWaitlistPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Mis Reservas y Listas</h1>
        
        <Tabs defaultValue="reservations">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reservations">
              Reservas Activas
            </TabsTrigger>
            <TabsTrigger value="waitlist">
              Listas de Espera
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reservations" className="mt-6">
            {/* Reservations component */}
            <div className="text-center py-12 text-muted-foreground">
              Componente de reservas aquí
            </div>
          </TabsContent>
          
          <TabsContent value="waitlist" className="mt-6">
            <WaitlistDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ============================================================================
// Example 6: Mobile-Optimized Layout
// ============================================================================

/**
 * WaitlistDashboard with mobile-optimized layout
 */
export const MobileWaitlistPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <h1 className="text-xl font-bold">Listas de Espera</h1>
      </header>

      {/* Content */}
      <main className="p-4">
        <WaitlistDashboard />
      </main>
    </div>
  );
};

// ============================================================================
// Example 7: With Empty State Action
// ============================================================================

/**
 * WaitlistDashboard with custom action when empty
 */
import { Card, CardContent } from '@/components/ui/card';

export const WaitlistPageWithEmptyAction = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <WaitlistDashboard />

        {/* Additional info card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">¿Cómo funciona la lista de espera?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Regístrate cuando no haya plazas disponibles</li>
              <li>• Te notificaremos por email si se libera una plaza</li>
              <li>• Tendrás tiempo limitado para aceptar la oferta</li>
              <li>• Si aceptas, se creará tu reserva automáticamente</li>
            </ul>
            <Button
              className="mt-4"
              onClick={() => navigate('/calendar')}
            >
              Buscar Plazas Disponibles
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// Notes
// ============================================================================

/**
 * Key Features:
 * 
 * 1. Real-time Updates
 *    - Positions update every 30 seconds automatically
 *    - Supabase subscriptions for instant updates
 * 
 * 2. Queue Position
 *    - Shows user's position in each queue (#1, #2, etc.)
 *    - Displays number of people ahead
 *    - Special badge when user is first
 * 
 * 3. Cancellation
 *    - Voluntary cancellation with confirmation dialog
 *    - Cannot cancel if offer is pending
 *    - Updates UI immediately after cancellation
 * 
 * 4. Empty State
 *    - Friendly message when no active entries
 *    - Explains how to get into waitlist
 * 
 * 5. Status Indicators
 *    - "Offer Pending" badge when user has pending offer
 *    - "First in Queue" badge when user is #1
 *    - People ahead badge for all other positions
 * 
 * 6. Responsive Design
 *    - Works on mobile, tablet, and desktop
 *    - Touch-friendly buttons and interactions
 * 
 * Requirements Covered:
 * - 4.1: Lists all active entries
 * - 4.2: Shows position in queue
 * - 4.3: Shows people ahead
 * - 4.4: Shows date and group
 * - 4.5: Allows cancellation
 * - 4.6: Updates positions in real-time
 */
