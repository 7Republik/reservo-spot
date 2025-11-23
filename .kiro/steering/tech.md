# RESERVEO - Technical Stack

## Core Technologies
Siempre hablame en español.
- **Frontend Framework**: React 18.3 with TypeScript 5.8
- **Build Tool**: Vite 5.4
- **Routing**: React Router DOM 6.30
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **State Management**: TanStack Query 5.83 (React Query)
- **Styling**: Tailwind CSS 3.4 with CSS custom properties for theming
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Form Handling**: React Hook Form 7.61 + Zod 3.25 validation
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **PWA**: Progressive Web App with Service Worker, offline support, and install prompt

## El proyecto usa ES modules para scripts y js

## Project Structure

- **Path Alias**: `@/` maps to `./src/`
- **TypeScript Config**: Relaxed settings (noImplicitAny: false, strictNullChecks: false)
- **Component Library**: shadcn/ui components in `src/components/ui/` (DO NOT MODIFY)
- **Custom Components**: Feature-based organization in `src/components/`
- **Hooks**: Business logic separated into `src/hooks/` and `src/hooks/admin/`
- **Types**: Centralized in `src/types/admin/`
- **Supabase Integration**: Auto-generated types in `src/integrations/supabase/`

## Common Commands

```bash
# Development server (port 8080)
npm run dev

# Production build
npm run build

# Development build (with dev mode)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Supabase Commands

```bash
# Check local Supabase status
supabase status

# Generate TypeScript types from database
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Create new migration
supabase migration new migration_name

# Apply migrations locally
supabase db reset

# Push to remote
supabase db push
```

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key

## Database Architecture

- **26 main tables**: profiles, user_roles, organizations, parking_groups, parking_spots, reservations, license_plates, user_group_assignments, blocked_dates, reservation_settings, reservation_cancellation_log, incident_reports, user_warnings, reservation_checkins, checkin_infractions, checkin_settings, parking_group_checkin_config, user_blocks, waitlist_entries, waitlist_offers, waitlist_logs, waitlist_penalties, waitlist_cron_logs, notifications, notification_preferences, checkin_notifications
- **84 SQL functions**: Validation, business logic, check-in/check-out automation, waitlist processing, infraction detection, warning generation, notification system, statistics, and data operations
- **27 triggers**: Automatic profile creation, reservation cancellation, waitlist processing, check-in tracking, notification triggers, timestamp updates
- **106 RLS policies**: Row-level security on all sensitive tables with comprehensive access control
- **3 Storage buckets**: `floor-plans` (parking map images), `incident-photos` (incident evidence), `landing-screenshots` (landing page assets)
- **10 Scheduled Jobs (pg_cron)**: Check-in reset, infraction detection, warning generation, waitlist processing, offer expiration, notification cleanup

## Key Libraries

- **@supabase/supabase-js**: Database client
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state and validation
- **zod**: Schema validation
- **date-fns**: Date manipulation
- **react-zoom-pan-pinch**: Interactive map zoom/pan
- **recharts**: Charts and data visualization
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Tailwind class merging utility

## Testing

### K6 Load Testing
- **Performance testing suite** with smoke, load, stress, and spike tests
- **Feature-specific tests**: Check-in, waitlist, and statistics tests
- **Test scripts**: Located in `tests/k6/` with helper utilities
- **Quick start**: See `K6-QUICK-START.md` for 5-minute setup
- **Full documentation**: See `docs/K6-LOAD-TESTING-GUIDE.md`

### Test Commands
```bash
# Basic tests
npm run test:k6:smoke   # Smoke test (1 min, 2 VUs)
npm run test:k6:load    # Load test (10 min, 50-100 VUs)
npm run test:k6:stress  # Stress test (25 min, 100-400 VUs)
npm run test:k6:spike   # Spike test (10 min, 50-500 VUs)

# Feature-specific tests
npm run test:k6:checkin        # Check-in/Check-out (15 min, 200 VUs)
npm run test:k6:waitlist       # Lista de espera (10 min, 50 VUs)
npm run test:k6:checkin-stats  # Estadísticas (5 min, 20 VUs)
```
