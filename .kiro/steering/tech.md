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

- **11 main tables**: profiles, user_roles, parking_groups, parking_spots, reservations, license_plates, user_group_assignments, blocked_dates, reservation_settings, reservation_cancellation_log, incident_reports
- **15+ SQL functions**: Validation, business logic, and data operations
- **6 triggers**: Automatic profile creation, reservation cancellation, timestamp updates
- **40+ RLS policies**: Row-level security on all sensitive tables
- **Storage bucket**: `floor-plans` for parking map images

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
