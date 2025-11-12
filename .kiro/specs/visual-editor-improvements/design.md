# Design Document - Mejoras del Editor Visual de Plazas

## Overview

Este documento detalla el diseño técnico para transformar el Editor Visual de Plazas en una herramienta profesional de nivel industrial. El diseño se enfoca en mejorar la experiencia de usuario mediante controles intuitivos, feedback visual claro, y una arquitectura modular que facilite el mantenimiento y futuras extensiones.

### Objetivos de Diseño

1. **Usabilidad Profesional**: Controles similares a software de diseño (Figma, Sketch, Adobe XD)
2. **Feedback Visual Claro**: El usuario siempre sabe qué está haciendo y en qué estado se encuentra
3. **Arquitectura Modular**: Componentes reutilizables y fáciles de mantener
4. **Performance**: Renderizado eficiente incluso con 100+ plazas
5. **Responsive**: Funcional en tablets y desktops, con mensaje claro en móviles

## Architecture

### Component Hierarchy

```
VisualEditorTab (Orchestrator)
├── MobileRestrictionMessage (< 768px)
└── DesktopEditor (>= 768px)
    ├── EditorHeader
    │   ├── GroupSelector
    │   └── HelpButton
    ├── EditorSidebar (Right Panel)
    │   ├── StatsPanel
    │   │   ├── PlazasCounter
    │   │   ├── AttributesBreakdown
    │   │   └── ProgressBar
    │   ├── ToolsPanel
    │   │   ├── DrawingModeToggle
    │   │   ├── HandToolToggle
    │   │   ├── LockToggle
    │   │   └── SizeSlider
    │   └── LegendPanel
    │       ├── StandardSpot
    │       ├── AccessibleSpot
    │       ├── ChargerSpot
    │       ├── CompactSpot
    │       └── MultiAttributeExample
    ├── EditorCanvas
    │   ├── ModeIndicator (Magic Border)
    │   ├── CanvasControls
    │   │   ├── ZoomIn
    │   │   ├── ZoomOut
    │   │   └── ResetView
    │   ├── FloorPlanImage
    │   ├── SpotButtons[]
    │   │   └── DraggableSpot
    │   └── GhostPreview (when drawing)
    └── SpotAttributesDialog
        ├── SpotNumberInput
        ├── AttributesCheckboxes
        ├── SaveButton
        └── DeleteButton
```

### State Management

```typescript
// Editor State (useVisualEditor hook)
interface EditorState {
  // Group & Spots
  selectedGroup: ParkingGroup | null;
  spots: ParkingSpot[];
  
  // UI State
  isDrawingMode: boolean;
  isHandToolActive: boolean;
  isCanvasLocked: boolean;
  spotButtonSize: number; // 12-64px
  
  // Canvas State
  floorPlanDimensions: { width: number; height: number };
  zoomLevel: number;
  panPosition: { x: number; y: number };
  
  // Interaction State
  isDraggingSpot: boolean;
  draggedSpotId: string | null;
  ghostPosition: { x: number; y: number } | null;
  
  // Dialog State
  selectedSpotForEdit: ParkingSpot | null;
  isDialogOpen: boolean;
  
  // Loading State
  loading: boolean;
}
```

## Components and Interfaces

### 1. MobileRestrictionMessage

**Purpose**: Mostrar mensaje informativo en dispositivos móviles

**Props**:
```typescript
interface MobileRestrictionMessageProps {
  // No props needed
}
```

**Behavior**:
- Se muestra solo cuando `window.innerWidth < 768px`
- Incluye icono de tablet/desktop
- Mensaje claro y amigable
- Botón para volver al dashboard

**Implementation**:
```tsx
<Card className="m-4">
  <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
    <Monitor className="w-16 h-16 text-muted-foreground" />
    <h3 className="text-xl font-semibold">Editor Visual no disponible en móvil</h3>
    <p className="text-center text-muted-foreground max-w-md">
      El Editor Visual requiere una pantalla de tablet o PC para funcionar correctamente.
      Por favor, accede desde un dispositivo con pantalla más grande.
    </p>
    <Button onClick={() => navigate('/admin')}>
      Volver al Panel Admin
    </Button>
  </CardContent>
</Card>
```

### 2. EditorSidebar

**Purpose**: Panel lateral con controles y estadísticas

**Props**:
```typescript
interface EditorSidebarProps {
  stats: EditorStats;
  tools: EditorTools;
  legend: LegendItem[];
  onToolChange: (tool: string, value: any) => void;
}

interface EditorStats {
  totalSpots: number;
  maxSpots: number;
  accessibleCount: number;
  chargerCount: number;
  compactCount: number;
  percentage: number;
}

interface EditorTools {
  isDrawingMode: boolean;
  isHandToolActive: boolean;
  isCanvasLocked: boolean;
  spotButtonSize: number;
}

interface LegendItem {
  type: 'standard' | 'accessible' | 'charger' | 'compact' | 'multi';
  label: string;
  color: string | string[]; // Array for multi-attribute
  icon?: React.ReactNode;
}
```

**Layout**:
```tsx
<aside className="w-80 border-l bg-card p-4 space-y-6 overflow-y-auto">
  {/* Stats Panel */}
  <section>
    <h3 className="font-semibold mb-3">Estadísticas</h3>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Plazas creadas:</span>
        <Badge>{stats.totalSpots} / {stats.maxSpots}</Badge>
      </div>
      <Progress value={stats.percentage} />
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>♿ {stats.accessibleCount}</div>
        <div>🔌 {stats.chargerCount}</div>
        <div>📏 {stats.compactCount}</div>
      </div>
    </div>
  </section>

  {/* Tools Panel */}
  <section>
    <h3 className="font-semibold mb-3">Herramientas</h3>
    <div className="space-y-3">
      <Button 
        variant={tools.isDrawingMode ? "default" : "outline"}
        className="w-full"
      >
        <Pencil className="w-4 h-4 mr-2" />
        Modo Dibujo
      </Button>
      
      <Button 
        variant={tools.isHandToolActive ? "default" : "outline"}
        className="w-full"
      >
        <Hand className="w-4 h-4 mr-2" />
        Herramienta Mano
      </Button>
      
      <div className="flex items-center justify-between">
        <Label>Bloquear Canvas</Label>
        <Switch checked={tools.isCanvasLocked} />
      </div>
      
      <div className="space-y-2">
        <Label>Tamaño: {tools.spotButtonSize}px</Label>
        <Slider 
          min={12} 
          max={64} 
          step={4}
          value={[tools.spotButtonSize]}
        />
      </div>
    </div>
  </section>

  {/* Legend Panel */}
  <section>
    <h3 className="font-semibold mb-3">Leyenda</h3>
    <div className="space-y-2">
      {legend.map(item => (
        <LegendItem key={item.type} {...item} />
      ))}
    </div>
  </section>
</aside>
```

### 3. EditorCanvas

**Purpose**: Área principal de trabajo con el plano y las plazas

**Props**:
```typescript
interface EditorCanvasProps {
  floorPlanUrl: string;
  spots: ParkingSpot[];
  spotButtonSize: number;
  isDrawingMode: boolean;
  isHandToolActive: boolean;
  isCanvasLocked: boolean;
  ghostPosition: { x: number; y: number } | null;
  onCanvasClick: (x: number, y: number) => void;
  onSpotClick: (spot: ParkingSpot) => void;
  onSpotDragStart: (spot: ParkingSpot) => void;
  onSpotDragEnd: (spot: ParkingSpot, x: number, y: number) => void;
  onMouseMove: (x: number, y: number) => void;
}
```

**Key Features**:

1. **Lock/Unlock System**:
```typescript
const handleWheel = (e: WheelEvent) => {
  if (!isCanvasLocked) {
    // Allow normal page scroll
    return;
  }
  
  // Prevent page scroll and do zoom instead
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  setZoomLevel(prev => Math.max(0.5, Math.min(4, prev + delta)));
};
```

2. **Magic Border Indicator**:
```css
.editor-canvas-active {
  position: relative;
}

.editor-canvas-active::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(
    45deg,
    hsl(var(--primary)),
    hsl(var(--primary) / 0.5),
    hsl(var(--primary))
  );
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: magic-border 3s linear infinite;
}

@keyframes magic-border {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

3. **Ghost Preview**:
```tsx
{isDrawingMode && ghostPosition && (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${ghostPosition.x}%`,
      top: `${ghostPosition.y}%`,
      width: `${spotButtonSize}px`,
      height: `${spotButtonSize}px`,
      transform: 'translate(-50%, -50%)',
    }}
  >
    <div className="w-full h-full rounded-md bg-primary/30 border-2 border-primary border-dashed animate-pulse" />
  </div>
)}
```

### 4. DraggableSpot

**Purpose**: Botón de plaza con capacidad de arrastre

**Props**:
```typescript
interface DraggableSpotProps {
  spot: ParkingSpot;
  size: number;
  isDragging: boolean;
  isDrawingMode: boolean;
  isHandToolActive: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
}
```

**Color Logic**:
```typescript
const getSpotColors = (spot: ParkingSpot): string[] => {
  const colors: string[] = [];
  
  if (spot.is_accessible) colors.push('hsl(var(--blue-500))'); // Azul
  if (spot.has_charger) colors.push('hsl(var(--green-500))'); // Verde
  if (spot.is_compact) colors.push('hsl(var(--yellow-500))'); // Amarillo
  
  if (colors.length === 0) {
    colors.push('hsl(var(--primary))'); // Color estándar
  }
  
  return colors;
};

const getSpotBackground = (colors: string[]): string => {
  if (colors.length === 1) {
    return colors[0];
  }
  
  if (colors.length === 2) {
    return `linear-gradient(90deg, ${colors[0]} 50%, ${colors[1]} 50%)`;
  }
  
  if (colors.length === 3) {
    return `linear-gradient(90deg, ${colors[0]} 33.33%, ${colors[1]} 33.33% 66.66%, ${colors[2]} 66.66%)`;
  }
  
  return colors[0];
};
```

**Font Size Logic**:
```typescript
const getFontSize = (spotNumber: string, buttonSize: number): number => {
  const baseSize = buttonSize * 0.4; // 40% del tamaño del botón
  const charCount = spotNumber.length;
  
  // Reducir tamaño si el número es muy largo
  if (charCount > 4) {
    return baseSize * 0.8;
  }
  if (charCount > 6) {
    return baseSize * 0.6;
  }
  
  return baseSize;
};
```

**Drag Implementation**:
```tsx
const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
const [currentPos, setCurrentPos] = useState({ x: spot.position_x, y: spot.position_y });

const handleMouseDown = (e: React.MouseEvent) => {
  if (isDrawingMode || isHandToolActive) return;
  
  e.stopPropagation();
  setDragStart({ x: e.clientX, y: e.clientY });
  onDragStart();
};

const handleMouseMove = (e: MouseEvent) => {
  if (!dragStart) return;
  
  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  
  setCurrentPos({ x, y });
};

const handleMouseUp = () => {
  if (!dragStart) return;
  
  onDragEnd(currentPos.x, currentPos.y);
  setDragStart(null);
};
```

### 5. StatsPanel

**Purpose**: Mostrar estadísticas en tiempo real

**Props**:
```typescript
interface StatsPanelProps {
  spots: ParkingSpot[];
  maxSpots: number;
}
```

**Calculations**:
```typescript
const calculateStats = (spots: ParkingSpot[], maxSpots: number): EditorStats => {
  const totalSpots = spots.length;
  const accessibleCount = spots.filter(s => s.is_accessible).length;
  const chargerCount = spots.filter(s => s.has_charger).length;
  const compactCount = spots.filter(s => s.is_compact).length;
  const percentage = (totalSpots / maxSpots) * 100;
  
  return {
    totalSpots,
    maxSpots,
    accessibleCount,
    chargerCount,
    compactCount,
    percentage,
  };
};
```

**Visual Alerts**:
```tsx
{stats.percentage >= 90 && stats.percentage < 100 && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Cerca del límite: {stats.totalSpots}/{stats.maxSpots} plazas
    </AlertDescription>
  </Alert>
)}

{stats.percentage >= 100 && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Límite alcanzado. No se pueden crear más plazas.
    </AlertDescription>
  </Alert>
)}
```

### 6. HelpDialog

**Purpose**: Sistema de ayuda contextual

**Content Structure**:
```typescript
interface HelpSection {
  title: string;
  icon: React.ReactNode;
  content: string;
  tips?: string[];
}

const helpSections: HelpSection[] = [
  {
    title: "Modo Dibujo",
    icon: <Pencil />,
    content: "Activa el modo dibujo para crear nuevas plazas haciendo clic en el plano.",
    tips: [
      "Ajusta el tamaño antes de dibujar",
      "El preview fantasma muestra dónde se creará la plaza",
      "Se desactiva automáticamente al alcanzar el límite"
    ]
  },
  {
    title: "Mover Plazas",
    icon: <Move />,
    content: "Haz clic y arrastra una plaza para moverla a una nueva posición.",
    tips: [
      "Desactiva el modo dibujo primero",
      "La posición se guarda automáticamente",
      "Verás una sombra en la posición original"
    ]
  },
  {
    title: "Editar Atributos",
    icon: <Edit />,
    content: "Haz clic en una plaza para editar su número y atributos.",
    tips: [
      "Los colores cambian según los atributos",
      "Plazas con múltiples atributos muestran colores divididos"
    ]
  },
  {
    title: "Navegación",
    icon: <Hand />,
    content: "Usa la herramienta mano para desplazarte por el plano sin afectar las plazas.",
    tips: [
      "Bloquea el canvas para hacer zoom con scroll",
      "Usa los controles de zoom en la esquina",
      "Presiona Escape para desbloquear"
    ]
  }
];
```

## Data Models

### Database Schema Changes

**Tabla: `parking_groups`**
```sql
-- Agregar columna para guardar tamaño de botón por grupo
ALTER TABLE parking_groups 
ADD COLUMN IF NOT EXISTS button_size INTEGER DEFAULT 32 CHECK (button_size >= 12 AND button_size <= 64);

-- Agregar índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_parking_groups_button_size ON parking_groups(button_size);
```

**Tabla: `parking_spots`**
```sql
-- Ya existe, no requiere cambios estructurales
-- Columnas relevantes:
-- - position_x: NUMERIC (porcentaje 0-100)
-- - position_y: NUMERIC (porcentaje 0-100)
-- - is_accessible: BOOLEAN
-- - has_charger: BOOLEAN
-- - is_compact: BOOLEAN
-- - spot_number: TEXT
```

### TypeScript Types

```typescript
// Extend existing types
export interface EditorTools {
  isDrawingMode: boolean;
  isHandToolActive: boolean;
  isCanvasLocked: boolean;
  spotButtonSize: number;
}

export interface EditorStats {
  totalSpots: number;
  maxSpots: number;
  accessibleCount: number;
  chargerCount: number;
  compactCount: number;
  percentage: number;
}

export interface GhostPreview {
  x: number;
  y: number;
  size: number;
}

export interface DragState {
  isDragging: boolean;
  spotId: string | null;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
}

export interface CanvasState {
  isLocked: boolean;
  zoomLevel: number;
  panPosition: { x: number; y: number };
}
```

## Error Handling

### Error Scenarios

1. **Límite de Plazas Alcanzado**:
```typescript
if (spots.length >= selectedGroup.max_spots) {
  toast.error(`Límite alcanzado: ${selectedGroup.max_spots} plazas máximo`);
  setIsDrawingMode(false);
  return;
}
```

2. **Fallo al Guardar Posición**:
```typescript
try {
  await updateSpotPosition(spotId, x, y);
} catch (error) {
  toast.error("Error al guardar posición. Revirtiendo...");
  // Revert to original position
  setSpots(prev => prev.map(s => 
    s.id === spotId ? { ...s, position_x: originalX, position_y: originalY } : s
  ));
}
```

3. **Plano No Disponible**:
```tsx
{!selectedGroup?.floor_plan_url && (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Este grupo no tiene un plano de planta configurado.
      Por favor, sube una imagen en la configuración del grupo.
    </AlertDescription>
  </Alert>
)}
```

4. **Dispositivo Móvil**:
```typescript
const isMobile = () => window.innerWidth < 768;

if (isMobile()) {
  return <MobileRestrictionMessage />;
}
```

## Testing Strategy

### Unit Tests

1. **Color Logic Tests**:
```typescript
describe('getSpotColors', () => {
  it('should return primary color for standard spot', () => {
    const spot = { is_accessible: false, has_charger: false, is_compact: false };
    expect(getSpotColors(spot)).toEqual(['hsl(var(--primary))']);
  });
  
  it('should return two colors for spot with two attributes', () => {
    const spot = { is_accessible: true, has_charger: true, is_compact: false };
    expect(getSpotColors(spot)).toHaveLength(2);
  });
  
  it('should return three colors for spot with all attributes', () => {
    const spot = { is_accessible: true, has_charger: true, is_compact: true };
    expect(getSpotColors(spot)).toHaveLength(3);
  });
});
```

2. **Stats Calculation Tests**:
```typescript
describe('calculateStats', () => {
  it('should calculate correct percentage', () => {
    const spots = Array(50).fill({});
    const stats = calculateStats(spots, 100);
    expect(stats.percentage).toBe(50);
  });
  
  it('should count attributes correctly', () => {
    const spots = [
      { is_accessible: true, has_charger: false, is_compact: false },
      { is_accessible: true, has_charger: true, is_compact: false },
      { is_accessible: false, has_charger: true, is_compact: true },
    ];
    const stats = calculateStats(spots, 100);
    expect(stats.accessibleCount).toBe(2);
    expect(stats.chargerCount).toBe(2);
    expect(stats.compactCount).toBe(1);
  });
});
```

3. **Font Size Logic Tests**:
```typescript
describe('getFontSize', () => {
  it('should return base size for short numbers', () => {
    expect(getFontSize('A-1', 32)).toBe(12.8); // 40% of 32
  });
  
  it('should reduce size for long numbers', () => {
    const shortSize = getFontSize('A-1', 32);
    const longSize = getFontSize('A-12345', 32);
    expect(longSize).toBeLessThan(shortSize);
  });
});
```

### Integration Tests

1. **Create Spot Flow**:
```typescript
it('should create spot when clicking in drawing mode', async () => {
  render(<VisualEditorTab />);
  
  // Activate drawing mode
  const drawButton = screen.getByText(/Modo Dibujo/);
  fireEvent.click(drawButton);
  
  // Click on canvas
  const canvas = screen.getByRole('img');
  fireEvent.click(canvas, { clientX: 100, clientY: 100 });
  
  // Verify spot was created
  await waitFor(() => {
    expect(screen.getByText(/Plaza.*creada/)).toBeInTheDocument();
  });
});
```

2. **Drag Spot Flow**:
```typescript
it('should move spot when dragging', async () => {
  render(<VisualEditorTab />);
  
  const spot = screen.getByText('A-1');
  
  // Start drag
  fireEvent.mouseDown(spot);
  fireEvent.mouseMove(document, { clientX: 200, clientY: 200 });
  fireEvent.mouseUp(document);
  
  // Verify position updated
  await waitFor(() => {
    expect(screen.getByText(/Posición actualizada/)).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

- [ ] Crear plaza en modo dibujo
- [ ] Mover plaza arrastrando
- [ ] Editar atributos de plaza
- [ ] Eliminar plaza
- [ ] Cambiar tamaño con slider
- [ ] Activar/desactivar herramienta mano
- [ ] Bloquear/desbloquear canvas
- [ ] Zoom con scroll (bloqueado)
- [ ] Scroll normal (desbloqueado)
- [ ] Ver estadísticas actualizarse
- [ ] Alcanzar límite de plazas
- [ ] Ver leyenda
- [ ] Abrir ayuda
- [ ] Probar en tablet
- [ ] Probar en móvil (ver mensaje)
- [ ] Verificar colores de atributos
- [ ] Verificar colores múltiples
- [ ] Preview fantasma en modo dibujo

## Performance Considerations

### Optimization Strategies

1. **Memoization**:
```typescript
const MemoizedSpot = React.memo(DraggableSpot, (prev, next) => {
  return (
    prev.spot.id === next.spot.id &&
    prev.spot.position_x === next.spot.position_x &&
    prev.spot.position_y === next.spot.position_y &&
    prev.size === next.size &&
    prev.isDragging === next.isDragging
  );
});
```

2. **Virtualization** (si > 100 plazas):
```typescript
// Considerar react-window o react-virtualized
// Solo renderizar plazas visibles en el viewport actual
```

3. **Debounce Slider**:
```typescript
const debouncedUpdateSize = useMemo(
  () => debounce((size: number) => {
    updateButtonSize(size);
  }, 300),
  []
);
```

4. **Lazy Load Floor Plan**:
```tsx
<img
  src={floorPlanUrl}
  loading="lazy"
  decoding="async"
  alt="Plano de planta"
/>
```

## Accessibility

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation**:
```typescript
// Tab through spots
// Enter to edit
// Escape to cancel
// Arrow keys to move (optional)

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    setIsDrawingMode(false);
    setIsHandToolActive(false);
    setIsCanvasLocked(false);
  }
  
  if (e.key === 'Enter' && selectedSpot) {
    openEditDialog(selectedSpot);
  }
};
```

2. **ARIA Labels**:
```tsx
<button
  aria-label={`Plaza ${spot.spot_number}${spot.is_accessible ? ', accesible' : ''}${spot.has_charger ? ', con cargador' : ''}${spot.is_compact ? ', compacta' : ''}`}
  role="button"
  tabIndex={0}
>
  {spot.spot_number}
</button>
```

3. **Focus Management**:
```typescript
// Focus on newly created spot
useEffect(() => {
  if (lastCreatedSpotId) {
    const spotElement = document.getElementById(`spot-${lastCreatedSpotId}`);
    spotElement?.focus();
  }
}, [lastCreatedSpotId]);
```

4. **Color Contrast**:
- Todos los colores de atributos deben tener contraste mínimo 4.5:1
- Texto del número de plaza siempre legible sobre fondo

## Migration Strategy

### Phase 1: Preparación (No Breaking Changes)
1. Agregar columna `button_size` a `parking_groups`
2. Migrar valores existentes (default 32px)
3. Crear nuevos componentes sin afectar los existentes

### Phase 2: Implementación Gradual
1. Implementar nuevos componentes en paralelo
2. Feature flag para activar nuevo editor
3. Testing exhaustivo con usuarios beta

### Phase 3: Rollout
1. Activar para todos los usuarios
2. Deprecar componentes antiguos
3. Limpiar código legacy

### Rollback Plan
- Mantener componentes antiguos durante 2 sprints
- Feature flag para revertir si hay problemas críticos
- Backup de datos antes de migración

## Future Enhancements

1. **Undo/Redo**: Stack de acciones para deshacer cambios
2. **Snap to Grid**: Alinear plazas automáticamente
3. **Multi-Select**: Seleccionar y mover múltiples plazas
4. **Copy/Paste**: Duplicar plazas rápidamente
5. **Templates**: Guardar layouts como plantillas
6. **Export**: Exportar layout como imagen o PDF
7. **Layers**: Organizar plazas en capas
8. **Rotation**: Rotar plazas para layouts complejos
