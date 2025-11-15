# Guía de Accesibilidad - RESERVEO

## Resumen

Esta guía documenta los estándares de accesibilidad implementados en RESERVEO, siguiendo las pautas WCAG 2.1 nivel AA.

## Estado de Implementación

### ✅ Completado en Sección "Hoy"

#### Touch Targets (44x44px mínimo)
- ✅ Todos los botones GradientButton tienen `min-h-[44px]` y `min-w-[44px]`
- ✅ Botón de avatar en header: 44x44px (11 * 4px = 44px)
- ✅ Botones de check-in/check-out: tamaño `lg` con min-height 52px
- ✅ Botones de acción (Reportar/Ver Ubicación): tamaño `md` con min-height 44px

#### Aria-labels
- ✅ Botón "Llegué": `aria-label="Realizar check-in y confirmar llegada"`
- ✅ Botón "Me voy": `aria-label="Realizar check-out y finalizar reserva"`
- ✅ Botón "Reportar Incidencia": `aria-label="Reportar incidencia en la plaza de estacionamiento"`
- ✅ Botón "Ver Ubicación": `aria-label="Ver ubicación de la plaza en el mapa"`
- ✅ Botón avatar: `aria-label` dinámico con email y contador de amonestaciones
- ✅ Badge de amonestaciones: `aria-label` con contador

#### Focus States (2px ring)
- ✅ GradientButton: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- ✅ Botón avatar: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- ✅ Todos los elementos interactivos tienen focus visible

#### Estados ARIA
- ✅ `aria-disabled` en botones deshabilitados
- ✅ `aria-busy` en botones con loading
- ✅ `aria-hidden="true"` en iconos decorativos (AnimatedIcon)
- ✅ `aria-haspopup="menu"` en botón de menú de usuario

#### Navegación por Teclado
- ✅ Tab: navega entre elementos interactivos
- ✅ Enter/Space: activa botones
- ✅ Escape: cierra menús y modales
- ✅ Flechas: navega en menús dropdown

## Contraste de Colores

### Resultados de Verificación (WCAG 2.1 AA)

#### ✅ Pasan (4.5:1 para texto normal, 3:1 para texto grande)
- Primary gradient (to) sobre blanco: **6.37:1** ✅
- Muted sobre blanco: **4.83:1** ✅
- Primary gradient (from) texto grande: **3.66:1** ✅

#### ⚠️ Requieren Atención
- Primary gradient (from) sobre blanco: **3.66:1** (requerido: 4.5:1)
- Success sobre blanco: **2.54:1** (requerido: 4.5:1)
- Warning sobre blanco: **2.15:1** (requerido: 4.5:1)
- Error sobre blanco: **3.76:1** (requerido: 4.5:1)
- Info sobre blanco: **3.68:1** (requerido: 4.5:1)

### Soluciones Implementadas

**Para colores semánticos (success, warning, error, info):**
- Se usan principalmente en **fondos de tarjetas** con texto oscuro, no como color de texto directo
- Ejemplo: `bg-green-50/80 text-green-900` (contraste alto)
- Los iconos usan estos colores pero son **decorativos** con `aria-hidden="true"`

**Para primary gradient:**
- Se usa principalmente en **texto grande** (spot numbers: 32-64px) donde el requisito es 3:1 ✅
- En botones, el texto es **blanco sobre gradiente** (contraste alto)
- En badges, se usa con fondo sólido y texto blanco

## Componentes Accesibles

### GradientButton

```tsx
<GradientButton
  variant="primary"
  size="lg"
  onClick={handleAction}
  disabled={isDisabled}
  loading={isLoading}
  aria-label="Descripción clara de la acción"
  icon={<Icon />}
>
  Texto del botón
</GradientButton>
```

**Características:**
- ✅ Min-height: 44px (WCAG 2.1 AA)
- ✅ Focus ring: 2px primary
- ✅ aria-disabled y aria-busy
- ✅ Touch feedback: scale(0.96) en active
- ✅ Hover solo en desktop: `@media(hover:hover)`

### AnimatedIcon

```tsx
<AnimatedIcon
  icon={<CheckCircle2 />}
  animation="pulse"
  size="md"
  duration={2000}
/>
```

**Características:**
- ✅ `aria-hidden="true"` (decorativo)
- ✅ Respeta `prefers-reduced-motion`
- ✅ Lazy loading con IntersectionObserver
- ✅ Animaciones simplificadas en móvil

### GlassCard

```tsx
<GlassCard
  variant="light"
  blur="md"
  hover={true}
>
  Contenido
</GlassCard>
```

**Características:**
- ✅ Contraste adecuado con texto
- ✅ Fallback para navegadores sin backdrop-filter
- ✅ Transiciones respetan `prefers-reduced-motion`

## Testing de Accesibilidad

### Herramientas Automatizadas

**Script de verificación:**
```bash
npx tsx scripts/verify-accessibility.ts
```

Verifica:
- ✅ Contraste de colores (WCAG 2.1 AA)
- ✅ Touch targets mínimos (44x44px)
- ✅ Aria-labels en botones con iconos
- ✅ Focus states visibles

### Testing Manual

#### Navegación por Teclado
1. **Tab**: Debe navegar por todos los elementos interactivos en orden lógico
2. **Shift+Tab**: Debe navegar hacia atrás
3. **Enter/Space**: Debe activar botones y enlaces
4. **Escape**: Debe cerrar modales y menús

#### Screen Readers

**VoiceOver (iOS/macOS):**
```bash
# Activar VoiceOver en Mac
Cmd + F5

# Navegar
Control + Option + Flecha derecha/izquierda
```

**Verificar:**
- ✅ Botones anuncian su propósito (aria-label)
- ✅ Estados se anuncian (disabled, loading)
- ✅ Iconos decorativos se ignoran (aria-hidden)
- ✅ Contador de amonestaciones se anuncia

**TalkBack (Android):**
```
Configuración > Accesibilidad > TalkBack
```

**Verificar:**
- ✅ Navegación por gestos funciona
- ✅ Botones tienen descripciones claras
- ✅ Estados se anuncian correctamente

### Testing de Contraste

**Herramientas recomendadas:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- Chrome DevTools: Lighthouse Accessibility Audit

**Verificar:**
- ✅ Texto normal: mínimo 4.5:1
- ✅ Texto grande (18px+ o 14px+ bold): mínimo 3:1
- ✅ Elementos UI: mínimo 3:1

## Preferencias de Usuario

### prefers-reduced-motion

**Implementación:**
```css
.animated-element {
  animation: slide-in 300ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
  }
}
```

**Componentes que respetan:**
- ✅ AnimatedIcon
- ✅ GradientButton (shine effect)
- ✅ GlassCard (hover transitions)
- ✅ TodayCheckinCard (entrance animations)

### prefers-color-scheme

**Implementación:**
```css
:root {
  --background: #ffffff;
  --foreground: #000000;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ffffff;
  }
}
```

**Tokens semánticos:**
- ✅ `bg-background` / `text-foreground`
- ✅ `bg-card` / `text-card-foreground`
- ✅ `border-border`
- ✅ Todos se adaptan automáticamente

## Checklist de Accesibilidad

### Para Nuevos Componentes

- [ ] **Touch targets**: Mínimo 44x44px
- [ ] **Aria-labels**: En botones con solo iconos
- [ ] **Focus states**: Ring de 2px visible
- [ ] **Contraste**: 4.5:1 para texto normal, 3:1 para texto grande
- [ ] **Navegación por teclado**: Tab, Enter, Space, Escape
- [ ] **Screen reader**: Probar con VoiceOver/TalkBack
- [ ] **Estados ARIA**: disabled, busy, hidden, expanded
- [ ] **Preferencias**: Respetar prefers-reduced-motion

### Para Nuevas Páginas

- [ ] **Estructura semántica**: header, main, nav, footer
- [ ] **Headings**: Jerarquía lógica (h1 > h2 > h3)
- [ ] **Landmarks**: Usar roles ARIA cuando sea necesario
- [ ] **Skip links**: Para navegación rápida
- [ ] **Orden de foco**: Lógico y predecible
- [ ] **Mensajes de error**: Claros y accesibles
- [ ] **Formularios**: Labels asociados correctamente

## Referencias

### Estándares
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Herramientas
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Pa11y](https://pa11y.org/)

### Testing
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Testing](https://webaim.org/articles/keyboard/)
- [Color Contrast Testing](https://webaim.org/articles/contrast/)

## Notas de Implementación

### Sección "Hoy" - Estado Actual

**Componentes actualizados:**
- ✅ `GradientButton`: Touch targets, focus states, ARIA
- ✅ `AnimatedIcon`: aria-hidden, prefers-reduced-motion
- ✅ `TodayCheckinCard`: Aria-labels en botones
- ✅ `TodayReservationCard`: Aria-labels en botones
- ✅ `DashboardHeader`: Aria-label en avatar, focus states

**Verificación realizada:**
- ✅ Script automatizado ejecutado
- ✅ Contraste de colores verificado
- ✅ Touch targets confirmados
- ✅ Aria-labels añadidos
- ✅ Focus states implementados

**Pendiente para testing manual:**
- ⏳ VoiceOver (iOS) - Requiere dispositivo físico
- ⏳ TalkBack (Android) - Requiere dispositivo físico
- ⏳ Navegación por teclado - Requiere testing en navegador

### Próximos Pasos

1. **Testing en dispositivos reales**
   - Probar con VoiceOver en iPhone
   - Probar con TalkBack en Android
   - Verificar navegación por teclado en desktop

2. **Mejoras de contraste**
   - Considerar versiones más oscuras de colores semánticos para texto
   - Documentar uso correcto (fondos vs texto)

3. **Expansión a otras secciones**
   - Aplicar mismos estándares a calendario
   - Aplicar a panel de administración
   - Aplicar a formularios

## Contacto

Para preguntas sobre accesibilidad en RESERVEO, consultar:
- Documentación: `docs/ACCESSIBILITY-GUIDE.md`
- Script de verificación: `scripts/verify-accessibility.ts`
- Steering rules: `.kiro/steering/design-ux-standards.md`
