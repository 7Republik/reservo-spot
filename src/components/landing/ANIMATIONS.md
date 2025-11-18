# Animaciones de Landing Page

## Resumen

Se han implementado animaciones de scroll y microinteracciones en todos los componentes de la landing page, con soporte completo para `prefers-reduced-motion`.

## Hook: useScrollAnimation

### Ubicación
`src/hooks/useScrollAnimation.ts`

### Características

1. **Intersection Observer**: Detecta cuando los elementos entran en el viewport
2. **Prefers-Reduced-Motion**: Respeta automáticamente la preferencia del usuario
3. **Trigger Once**: Por defecto, las animaciones se ejecutan una sola vez
4. **Configurable**: Threshold, rootMargin y triggerOnce personalizables

### Uso Básico

```tsx
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';

const MyComponent = () => {
  const { ref, isVisible, prefersReducedMotion } = useScrollAnimation();

  return (
    <div 
      ref={ref as any}
      className={getAnimationClasses(isVisible, 'fadeInUp', prefersReducedMotion)}
    >
      Contenido animado
    </div>
  );
};
```

### Variantes de Animación

- `fadeIn`: Aparece gradualmente
- `fadeInUp`: Aparece desde abajo
- `fadeInDown`: Aparece desde arriba
- `fadeInLeft`: Aparece desde la izquierda
- `fadeInRight`: Aparece desde la derecha
- `scaleIn`: Aparece con efecto de escala
- `slideInUp`: Desliza desde abajo (más pronunciado)
- `slideInDown`: Desliza desde arriba (más pronunciado)

### Opciones de Configuración

```tsx
const { ref, isVisible, prefersReducedMotion } = useScrollAnimation({
  threshold: 0.2,              // Porcentaje visible para activar (0-1)
  rootMargin: '0px 0px -100px 0px', // Margen del viewport
  triggerOnce: true,           // Animar solo una vez
});
```

## Componentes Animados

### 1. ProblemsSection
- **Header**: fadeInUp
- **Cards**: fadeInUp con delay escalonado (100ms entre cada una)
- **CTA**: fadeInUp

### 2. SolutionsSection
- **Header**: fadeInUp
- **Items**: fadeInLeft/fadeInRight según posición de imagen

### 3. FeaturesDetailSection
- **Header**: fadeInUp
- **Tabs**: fadeInUp
- **Hover effects**: Scale en tabs y feature items

### 4. BenefitsByRoleSection
- **Header**: fadeInUp
- **Cards**: fadeInUp con delay escalonado (150ms entre cada una)

### 5. UseCasesSection
- **Header**: fadeInUp
- **Cards**: fadeInUp con delay escalonado (100ms entre cada una)
- **CTA**: fadeInUp

### 6. PricingSection
- **Header**: fadeInUp
- **Cards**: scaleIn con delay escalonado (150ms entre cada una)
- **Note**: fadeInUp

### 7. FAQSection
- **Header**: fadeInUp
- **FAQ Items**: fadeInUp con delay escalonado (80ms entre cada una)
- **CTA**: fadeInUp

### 8. FinalCTASection
- **Content**: scaleIn (todo el contenido junto)

## Hover Effects

Todos los componentes incluyen hover effects sutiles:

### Cards
```css
hover:shadow-lg hover:-translate-y-1 transition-all duration-300
```

### Botones
```css
hover:scale-105 hover:-translate-y-1 transition-all duration-300
```

### Tabs
```css
hover:scale-105 transition-all duration-300
```

### Feature Items
```css
hover:scale-105 hover:bg-muted transition-all duration-300
```

## Prefers-Reduced-Motion

### CSS Global
En `src/index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Hook JavaScript
El hook `useScrollAnimation` detecta automáticamente la preferencia:

```tsx
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  setPrefersReducedMotion(mediaQuery.matches);
  
  // Listener para cambios dinámicos
  mediaQuery.addEventListener('change', handleChange);
}, []);
```

Cuando está activado:
- Los elementos se muestran inmediatamente (sin animación)
- Los delays se eliminan
- Las transiciones se reducen a 0.01ms

## Performance

### Optimizaciones Implementadas

1. **Intersection Observer**: Más eficiente que scroll listeners
2. **Trigger Once**: Las animaciones se ejecutan solo una vez por defecto
3. **Lazy Loading**: Imágenes con `loading="lazy"`
4. **CSS Transitions**: Más eficientes que JavaScript animations
5. **Will-Change**: Implícito en transforms para mejor rendering

### Mejores Prácticas

- ✅ Usar `threshold` apropiado (0.1-0.3 para la mayoría)
- ✅ Delays escalonados para múltiples elementos (80-150ms)
- ✅ Duración de transiciones: 300-700ms
- ✅ Usar `transform` y `opacity` (GPU accelerated)
- ❌ Evitar animar `width`, `height`, `top`, `left`

## Testing

### Probar Prefers-Reduced-Motion

**Chrome DevTools:**
1. Abrir DevTools (F12)
2. Cmd/Ctrl + Shift + P
3. Buscar "Emulate CSS prefers-reduced-motion"
4. Seleccionar "reduce"

**Firefox:**
1. about:config
2. Buscar `ui.prefersReducedMotion`
3. Cambiar a 1

**macOS:**
Sistema > Accesibilidad > Pantalla > Reducir movimiento

**Windows:**
Configuración > Accesibilidad > Efectos visuales > Desactivar animaciones

## Mantenimiento

### Añadir Animaciones a Nuevos Componentes

1. Importar el hook:
```tsx
import { useScrollAnimation, getAnimationClasses } from '@/hooks/useScrollAnimation';
```

2. Usar en el componente:
```tsx
const { ref, isVisible, prefersReducedMotion } = useScrollAnimation();
```

3. Aplicar clases:
```tsx
<div 
  ref={ref as any}
  className={getAnimationClasses(isVisible, 'fadeInUp', prefersReducedMotion)}
>
```

### Personalizar Animaciones

Para crear nuevas variantes, editar `src/hooks/useScrollAnimation.ts`:

```tsx
export const animationVariants = {
  // ... variantes existentes
  myCustomVariant: {
    hidden: { opacity: 0, scale: 0.5, rotate: -10 },
    visible: { opacity: 1, scale: 1, rotate: 0 },
  },
} as const;
```

Y añadir el caso en `getAnimationClasses`:

```tsx
case 'myCustomVariant':
  return `${baseClasses} opacity-0 scale-50 -rotate-10`;
```

## Referencias

- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Web Animations Best Practices](https://web.dev/animations/)
