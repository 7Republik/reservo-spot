# RESERVEO - Project Structure

## Directory Organization

```
src/
├── components/          # React components (feature-based organization)
│   ├── ui/             # shadcn/ui base components (DO NOT MODIFY)
│   ├── admin/          # Admin panel components
│   │   ├── configuration/
│   │   ├── groups/
│   │   ├── license-plates/
│   │   ├── parking-spots/
│   │   ├── users/
│   │   ├── visual-editor/
│   │   └── skeletons/
│   ├── calendar/       # Calendar system components
│   ├── dashboard/      # User dashboard components
│   ├── group-selector/ # Group selection components
│   ├── license-plates/ # User license plate management
│   └── spot-selection/ # Interactive map components
├── hooks/              # Custom React hooks
│   └── admin/          # Admin-specific hooks with caching pattern
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and auto-generated types
├── lib/                # Utility functions
├── pages/              # Route-level page components
├── styles/             # Global CSS files
└── types/              # TypeScript type definitions
    └── admin/          # Admin-specific types

supabase/
├── config.toml         # Supabase local configuration
└── migrations/         # Database migration files (18 migrations)

docs/                   # Project documentation
```

## Component Organization Rules

### File Size Limits
- **Critical**: Components MUST NOT exceed 200 lines
- **Warning**: Review components at 150-200 lines
- **Healthy**: Keep components under 150 lines

### When to Modularize
1. Component exceeds 200 lines
2. More than 5 useState hooks
3. Complex conditional rendering (3+ nested ternaries)
4. Code repetition (3+ similar blocks)

### Modularization Strategies

**Option 1: Sub-components**
```
ParentComponent.tsx (400 lines)
  → ParentComponent.tsx (80 lines)
  → Section1.tsx (120 lines)
  → Section2.tsx (100 lines)
```

**Option 2: Logic extraction**
```
ComplexComponent.tsx (500 lines)
  → ComplexComponent.tsx (150 lines) - Orchestrator
  → useComponentLogic.ts (150 lines) - Business logic
  → SubComponent1.tsx (100 lines)
```

**Option 3: Feature-based (Recommended for large features)**
```
src/components/my-feature/
├── MyFeature.tsx           # Main orchestrator
├── components/             # Sub-components
│   ├── FeatureHeader.tsx
│   └── FeatureContent.tsx
└── dialogs/                # Feature-specific dialogs
    └── CreateDialog.tsx
```

## Naming Conventions

### Files
- **PascalCase**: `UserCard.tsx`, `ApprovalDialog.tsx`
- **Descriptive**: Use specific names, not generic ones
- **Consistent**: Match component name to file name

### Components
- **Named exports preferred**: `export const UserCard = () => {}`
- **Avoid default exports**: Makes refactoring harder
- **Props interface**: `ComponentNameProps` pattern

### Imports Order
1. React and external libraries
2. UI components from `@/components/ui/`
3. Custom components
4. Custom hooks
5. Types and interfaces
6. Utils and helpers

## Hook Patterns

### Admin Hooks (src/hooks/admin/)
- **Caching pattern**: Use `useRef` to cache data between renders
- **forceReload parameter**: Invalidate cache after mutations (CREATE/UPDATE/DELETE)
- **Consistent structure**: loadData, createItem, updateItem, deleteItem
- **Toast feedback**: Always provide user feedback on operations
- **Error handling**: Try-catch with console.error and toast.error

### Hook Structure
```typescript
export const useMyFeature = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false); // Cache flag

  const loadData = async (forceReload = false) => {
    if (isCached.current && !forceReload) return; // Use cache
    // ... fetch logic
    isCached.current = true; // Mark as cached
  };

  const createItem = async (data) => {
    // ... create logic
    await loadData(true); // Invalidate cache
  };

  return { data, loading, loadData, createItem };
};
```

## Styling Conventions

### CSS Tokens (CRITICAL)
- **NEVER use direct colors**: No `bg-blue-500`, `text-white`, etc.
- **ALWAYS use semantic tokens**: `bg-primary`, `text-foreground`, `border-border`
- **Theme support**: All tokens support light/dark mode automatically

### Available Tokens
- **Base**: `background`, `foreground`, `card`, `card-foreground`
- **Brand**: `primary`, `secondary`, `accent` (with `-foreground` variants)
- **States**: `destructive`, `muted` (with `-foreground` variants)
- **UI**: `border`, `input`, `ring`, `radius`

### Component Styling
```tsx
// ✅ CORRECT
<div className="bg-card text-card-foreground border-border">
<Button variant="destructive">Delete</Button>

// ❌ WRONG
<div className="bg-white text-black border-gray-300">
<Button className="bg-red-600">Delete</Button>
```

## Type Definitions

### Location
- **Admin types**: `src/types/admin/` (organized by feature)
- **Component props**: Inline or in same file
- **Shared types**: Export from `src/types/admin/index.ts`

### Supabase Types
- **Auto-generated**: `src/integrations/supabase/types.ts`
- **DO NOT EDIT**: Regenerate with `supabase gen types typescript`
- **Import from**: `@/integrations/supabase/types`

## Best Practices

1. **Separation of concerns**: UI in components, logic in hooks
2. **Composition over configuration**: Prefer composable components
3. **Early returns**: Handle edge cases first (loading, empty, error)
4. **Accessibility**: Include aria-labels, alt text, semantic HTML
5. **TypeScript**: Use explicit types, avoid `any`
6. **Error handling**: Always catch errors and provide user feedback
7. **Cache invalidation**: Use `forceReload=true` after mutations
8. **Documentation**: JSDoc comments for complex functions
