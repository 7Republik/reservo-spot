# Design Document - Landing Page Comercial

## Overview

Rediseño completo de la landing page de RESERVEO (`src/pages/Index.tsx`) con enfoque comercial B2B, utilizando el MCP de 21st.dev para generar secciones modernas inspiradas en el tema Basecamp. La página seguirá el enfoque "problema → solución" y destacará todas las funcionalidades desarrolladas del sistema.

## Architecture

### High-Level Structure

```
Index.tsx (Landing Page)
├── HeroSection (21st.dev)
├── ProblemsSection (21st.dev)
├── SolutionsSection (Custom + 21st.dev cards)
│   ├── ReservationFeature
│   ├── CheckInFeature
│   ├── WaitlistFeature
│   ├── IncidentsFeature
│   ├── NotificationsFeature
│   ├── WarningsFeature
│   ├── OfflineFeature
│   └── AdminFeature
├── FeaturesDetailSection (Tabs/Accordion)
├── BenefitsByRoleSection (21st.dev cards)
├── KeyBenefitsSection (Stats-style cards)
├── UseCasesSection (21st.dev)
├── ComparisonSection (Table/Grid)
├── TechnologySection (Logos + Features)
├── PricingSection (21st.dev pricing cards)
├── FAQSection (Accordion)
├── FinalCTASection (21st.dev)
└── Footer (Enhanced)
```

### Technology Stack

- **React 18.3** + **TypeScript**
- **Tailwind CSS** para estilos
- **21st.dev MCP** para generar secciones modernas
- **Lucide React** para iconos
- **Framer Motion** (opcional) para animaciones
- **React Router** para navegación


## Components and Interfaces

### 1. HeroSection Component

**Propósito:** Sección principal que captura atención y comunica valor inmediato

**Diseño:**
- Layout: Centrado con imagen/video a la derecha (desktop) o abajo (mobile)
- Headline: Grande, bold, problema-solución
- Subheadline: Explicación breve del valor
- CTAs: 2 botones (primario: "Solicitar Demo", secundario: "Ver Características")
- Microclaim: Badge o texto destacado con propuesta de valor
- Background: Gradiente sutil con glassmorphism

**Generación:**
```typescript
// Usar 21st.dev MCP
/iui Create a hero section for a corporate parking management system.
Include headline "¿Cansado de gestionar el aparcamiento con Excel?"
Subheadline about smart automated solution.
Two CTA buttons and a value proposition badge.
Modern glassmorphism style with gradient background.
```

**Props Interface:**
```typescript
interface HeroSectionProps {
  headline: string;
  subheadline: string;
  primaryCTA: { text: string; onClick: () => void };
  secondaryCTA: { text: string; onClick: () => void };
  microclaim: string;
  imageUrl?: string;
}
```

---

### 2. ProblemsSection Component

**Propósito:** Mostrar problemas comunes que resuenan con el cliente

**Diseño:**
- Título: "¿Te suena familiar?" o "Problemas que conoces bien"
- Grid: 2x3 o 3x2 cards con problemas
- Cada card: Icono, título corto, descripción breve
- Estilo: Cards con hover effect, iconos en rojo/naranja


**Problemas a mostrar:**
1. "Dobles reservas y conflictos constantes" (icon: AlertTriangle)
2. "Gestión manual con Excel y emails" (icon: FileSpreadsheet)
3. "Sin visibilidad de ocupación real" (icon: EyeOff)
4. "Incidentes sin resolver" (icon: AlertCircle)
5. "Falta de control de presencia" (icon: UserX)
6. "Reportes manuales y tediosos" (icon: FileText)

**Generación:**
```typescript
/cui Create a problems section with 6 cards in a grid.
Each card shows a common parking management problem.
Use warning/alert icons and subtle red/orange accents.
Title: "¿Te suena familiar?"
```

**Props Interface:**
```typescript
interface Problem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ProblemsSectionProps {
  title: string;
  problems: Problem[];
}
```

---

### 3. SolutionsSection Component

**Propósito:** Mostrar cómo RESERVEO resuelve cada problema con funcionalidades específicas

**Diseño:**
- Layout alternado: Imagen izquierda/derecha por cada solución
- 8 subsecciones (una por funcionalidad principal)
- Cada subsección: Título, descripción, lista de beneficios, screenshot/ilustración
- Transición suave entre secciones


**Soluciones a destacar:**

1. **Sistema de Reservas Inteligente**
   - Calendario mensual intuitivo
   - Mapa interactivo de plazas
   - Grupos y roles con prioridades
   - Cero conflictos por diseño

2. **Check-in/Check-out Automático**
   - Validación de presencia física
   - Detección automática de infracciones
   - Liberación temprana de plazas
   - Reportes de cumplimiento

3. **Lista de Espera Dinámica**
   - Registro automático cuando no hay plazas
   - Ofertas con tiempo límite
   - Sistema de prioridades
   - Penalizaciones por rechazos

4. **Gestión de Incidentes**
   - Reporte con foto desde móvil
   - Reasignación automática de plaza
   - Identificación de infractores
   - Advertencias automáticas

5. **Sistema de Notificaciones**
   - Notificaciones in-app en tiempo real
   - Emails automáticos
   - Preferencias personalizables
   - Recordatorios de check-in

6. **Gestión de Advertencias**
   - Tracking completo de infracciones
   - Bloqueos temporales automáticos
   - Historial permanente
   - Indicadores visuales

7. **Modo Offline**
   - Funciona sin conexión
   - Cache local de datos
   - Sincronización automática
   - Indicadores de estado

8. **Panel de Administración**
   - Gestión completa de usuarios
   - Editor visual de plazas
   - Estadísticas y reportes
   - Configuración centralizada


**Generación (ejemplo para una solución):**
```typescript
/cui Create a feature section with alternating layout.
Left side: Screenshot placeholder for parking reservation calendar.
Right side: Title "Sistema de Reservas Inteligente", 
description, and 4 bullet points with checkmarks.
Modern design with primary color accents.
```

**Props Interface:**
```typescript
interface Solution {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  imageUrl: string;
  imagePosition: 'left' | 'right';
}

interface SolutionsSectionProps {
  title: string;
  solutions: Solution[];
}
```

---

### 4. FeaturesDetailSection Component

**Propósito:** Mostrar características específicas de cada módulo en formato expandible

**Diseño:**
- Tabs horizontales o Accordion vertical
- 6 módulos principales
- Cada módulo muestra lista de características con checkmarks
- Badges para características destacadas ("Nuevo", "Popular")

**Módulos:**
1. **Reservas**: Calendario, mapa interactivo, grupos, roles, matrículas
2. **Check-in**: Validación, infracciones, bloqueos, reportes
3. **Waitlist**: Prioridad, ofertas, penalizaciones, posición
4. **Incidentes**: Fotos, reasignación, advertencias, tracking
5. **Notificaciones**: In-app, email, preferencias, recordatorios
6. **Administración**: Usuarios, plazas, reportes, configuración


**Generación:**
```typescript
/cui Create a tabbed section showing detailed features.
6 tabs for different modules (Reservations, Check-in, Waitlist, etc.)
Each tab shows a list of features with green checkmarks.
Some features have "New" or "Popular" badges.
```

**Props Interface:**
```typescript
interface Feature {
  name: string;
  badge?: 'new' | 'popular';
}

interface Module {
  id: string;
  name: string;
  icon: LucideIcon;
  features: Feature[];
}

interface FeaturesDetailSectionProps {
  modules: Module[];
}
```

---

### 5. BenefitsByRoleSection Component

**Propósito:** Mostrar beneficios específicos según el rol del usuario

**Diseño:**
- 3 columnas/cards para roles
- Cada card: Icono de rol, título, lista de beneficios
- Colores diferenciados por rol
- Quote o testimonio ficticio representativo

**Roles:**
1. **Empleados** (color: blue)
   - Reserva fácil y rápida
   - Visibilidad de disponibilidad
   - Notificaciones automáticas
   - Gestión de matrículas
   - Check-in desde móvil

2. **Administradores** (color: purple)
   - Control total de usuarios
   - Aprobación de matrículas
   - Gestión de incidentes
   - Reportes automáticos
   - Configuración flexible

3. **Directores/Management** (color: green)
   - Visibilidad completa de ocupación
   - Estadísticas en tiempo real
   - Optimización de recursos
   - Reducción de conflictos
   - Trazabilidad total


**Generación:**
```typescript
/cui Create a benefits section with 3 columns for different user roles.
Each column shows role name, icon, and 5 benefits with checkmarks.
Use different accent colors for each role (blue, purple, green).
Include a representative quote at the bottom of each card.
```

**Props Interface:**
```typescript
interface RoleBenefit {
  role: string;
  icon: LucideIcon;
  color: string;
  benefits: string[];
  quote?: string;
}

interface BenefitsByRoleSectionProps {
  roles: RoleBenefit[];
}
```

---

### 6. KeyBenefitsSection Component

**Propósito:** Destacar beneficios clave verificables del sistema

**Diseño:**
- 4 cards grandes con iconos
- Estilo similar a stats pero con beneficios
- Iconos animados en hover
- Descripción breve bajo cada beneficio

**Beneficios:**
1. "Cero conflictos de doble reserva" (icon: ShieldCheck)
2. "Trazabilidad completa de ocupación" (icon: FileCheck)
3. "Gestión automatizada de incidentes" (icon: Zap)
4. "Notificaciones en tiempo real" (icon: Bell)

**Generación:**
```typescript
/cui Create a benefits section with 4 large cards in a grid.
Each card shows an icon, benefit title, and brief description.
Use primary color for icons with hover animations.
Modern card design with subtle shadows.
```

**Props Interface:**
```typescript
interface KeyBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface KeyBenefitsSectionProps {
  benefits: KeyBenefit[];
}
```


---

### 7. UseCasesSection Component

**Propósito:** Mostrar aplicaciones en diferentes industrias

**Diseño:**
- Grid de 4 cards con casos de uso
- Cada card: Icono de industria, título, descripción, beneficios específicos
- Hover effect con elevación

**Casos de uso:**
1. **Oficinas Corporativas** (icon: Building2)
   - Gestión de múltiples plantas
   - Roles por departamento
   - Visitantes y externos

2. **Hospitales y Centros Médicos** (icon: Hospital)
   - Personal médico prioritario
   - Turnos rotativos
   - Emergencias

3. **Universidades** (icon: GraduationCap)
   - Profesores y estudiantes
   - Horarios académicos
   - Eventos especiales

4. **Centros Comerciales** (icon: ShoppingBag)
   - Empleados de tiendas
   - Gestión de turnos
   - Alta rotación

**Generación:**
```typescript
/cui Create a use cases section with 4 cards in a grid.
Each card shows an industry icon, title, description, and 3 specific benefits.
Modern card design with hover effects.
```

**Props Interface:**
```typescript
interface UseCase {
  industry: string;
  icon: LucideIcon;
  description: string;
  benefits: string[];
}

interface UseCasesSectionProps {
  title: string;
  useCases: UseCase[];
}
```


---

### 8. ComparisonSection Component

**Propósito:** Comparar gestión manual vs RESERVEO de forma objetiva

**Diseño:**
- Tabla o grid de 2 columnas
- 6 filas con puntos de comparación
- Iconos ❌ para manual, ✅ para RESERVEO
- Colores contrastantes (gris/rojo vs verde/azul)

**Comparaciones:**
| Aspecto | Gestión Manual | Con RESERVEO |
|---------|----------------|--------------|
| Reservas | Excel/Email | Sistema centralizado |
| Conflictos | Posibles | Imposibles por diseño |
| Visibilidad | Limitada | Tiempo real |
| Control presencia | Manual | Check-in automático |
| Incidentes | Llamadas/Emails | Sistema con fotos |
| Reportes | Manuales | Automáticos |

**Generación:**
```typescript
/cui Create a comparison table with 2 columns: "Manual Management" vs "With RESERVEO".
6 rows comparing different aspects.
Use X icons for manual and checkmarks for RESERVEO.
Modern table design with contrasting colors.
```

**Props Interface:**
```typescript
interface ComparisonRow {
  aspect: string;
  manual: string;
  withReserveo: string;
}

interface ComparisonSectionProps {
  title: string;
  comparisons: ComparisonRow[];
}
```


---

### 9. TechnologySection Component

**Propósito:** Mostrar stack tecnológico y características de seguridad

**Diseño:**
- 2 subsecciones: Tecnologías y Seguridad
- Logos de tecnologías en grid
- Lista de características de seguridad con iconos

**Tecnologías:**
- React + TypeScript
- Supabase (PostgreSQL)
- Vercel
- Tailwind CSS

**Seguridad:**
- Row Level Security (RLS)
- Autenticación segura
- Encriptación de datos
- Backups automáticos
- HTTPS/TLS

**Generación:**
```typescript
/cui Create a technology section with 2 parts.
Top: Grid of technology logos (React, Supabase, Vercel, Tailwind).
Bottom: Security features list with shield icons.
Clean, professional design.
```

**Props Interface:**
```typescript
interface Technology {
  name: string;
  logoUrl: string;
}

interface SecurityFeature {
  name: string;
  description: string;
}

interface TechnologySectionProps {
  technologies: Technology[];
  securityFeatures: SecurityFeature[];
}
```


---

### 10. PricingSection Component

**Propósito:** Mostrar planes disponibles (placeholder sin precios específicos)

**Diseño:**
- 3 cards de pricing
- Plan central destacado ("Recomendado")
- CTA: "Contactar para Precio"
- Lista de características por plan

**Planes:**
1. **Starter** (Pequeñas empresas)
   - Hasta 50 plazas
   - Funcionalidades básicas
   - Soporte email

2. **Professional** (Empresas medianas) - RECOMENDADO
   - Hasta 200 plazas
   - Todas las funcionalidades
   - Soporte prioritario

3. **Enterprise** (Grandes corporaciones)
   - Plazas ilimitadas
   - Personalización
   - Soporte dedicado

**Generación:**
```typescript
/cui Create a pricing section with 3 tiers.
Each tier shows name, description, features list, and "Contact for Price" button.
Highlight the middle tier as "Recommended".
Modern pricing card design.
```

**Props Interface:**
```typescript
interface PricingTier {
  name: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

interface PricingSectionProps {
  tiers: PricingTier[];
}
```


---

### 11. FAQSection Component

**Propósito:** Responder preguntas frecuentes

**Diseño:**
- Accordion con 8 preguntas
- Solo una pregunta expandida a la vez
- Iconos de + / - para indicar estado

**Preguntas:**
1. ¿Cuánto tiempo toma implementar RESERVEO?
2. ¿Necesitamos hardware especial?
3. ¿Funciona en dispositivos móviles?
4. ¿Qué pasa si no hay conexión a internet?
5. ¿Cómo se gestionan y protegen los datos?
6. ¿Hay límite de usuarios o plazas?
7. ¿Incluye soporte técnico?
8. ¿Se puede personalizar según nuestras necesidades?

**Generación:**
```typescript
/cui Create an FAQ section with accordion.
8 questions about implementation, features, and support.
Only one question expanded at a time.
Clean accordion design with +/- icons.
```

**Props Interface:**
```typescript
interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
}
```

---

### 12. FinalCTASection Component

**Propósito:** Última oportunidad de conversión con CTA potente

**Diseño:**
- Sección destacada con background de color
- Headline persuasivo
- 2 CTAs: "Solicitar Demo Gratuita" y "Hablar con Ventas"
- Formulario simple opcional (nombre, email, empresa, teléfono)

**Generación:**
```typescript
/iui Create a final CTA section with bold headline.
"Transform Your Parking Management Today"
Two prominent buttons and optional contact form.
Eye-catching design with gradient background.
```

**Props Interface:**
```typescript
interface FinalCTASectionProps {
  headline: string;
  subheadline?: string;
  primaryCTA: { text: string; onClick: () => void };
  secondaryCTA: { text: string; onClick: () => void };
  showForm?: boolean;
}
```


---

### 13. Footer Component (Enhanced)

**Propósito:** Footer completo con links y contacto

**Diseño:**
- 4 columnas en desktop, stack en mobile
- Logo de RESERVEO
- Links organizados por categoría
- Redes sociales
- Copyright y créditos

**Columnas:**
1. **Producto**
   - Características
   - Casos de uso
   - Pricing
   - Demo

2. **Empresa**
   - Sobre nosotros
   - Contacto
   - Blog
   - Carreras

3. **Legal**
   - Privacidad
   - Términos
   - Cookies
   - GDPR

4. **Contacto**
   - Email: info@reserveo.app
   - Teléfono: +34 XXX XXX XXX
   - LinkedIn
   - Twitter

**Props Interface:**
```typescript
interface FooterLink {
  text: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  columns: FooterColumn[];
  socialLinks: { platform: string; url: string }[];
}
```

---

## Data Models

### Landing Page Content

```typescript
interface LandingPageContent {
  hero: {
    headline: string;
    subheadline: string;
    microclaim: string;
    imageUrl?: string;
  };
  problems: Problem[];
  solutions: Solution[];
  modules: Module[];
  roleBenefits: RoleBenefit[];
  keyBenefits: KeyBenefit[];
  useCases: UseCase[];
  comparisons: ComparisonRow[];
  technologies: Technology[];
  securityFeatures: SecurityFeature[];
  pricingTiers: PricingTier[];
  faqs: FAQ[];
  finalCTA: {
    headline: string;
    subheadline?: string;
  };
}
```


---

## Error Handling

### Navigation Errors
- Si falla navegación a /auth, mostrar toast con error
- Fallback a reload de página

### Image Loading
- Usar placeholders mientras cargan imágenes
- Fallback a color sólido si imagen falla

### Form Submission (Final CTA)
- Validación de campos requeridos
- Mensajes de error claros
- Confirmación visual de envío exitoso
- Manejo de errores de red

---

## Testing Strategy

### Visual Testing
- Verificar responsive en mobile, tablet, desktop
- Probar en diferentes navegadores (Chrome, Firefox, Safari)
- Verificar animaciones y transiciones
- Comprobar contraste de colores (accesibilidad)

### Functional Testing
- Verificar navegación de CTAs
- Probar accordion/tabs
- Verificar formulario de contacto
- Probar links del footer

### Performance Testing
- Lighthouse score > 90
- Tiempo de carga < 3 segundos
- Optimización de imágenes
- Lazy loading de secciones

### SEO Testing
- Meta tags correctos
- Headings semánticos
- Alt text en imágenes
- Sitemap y robots.txt

---

## Implementation Strategy

### Phase 1: Estructura y Componentes Base
1. Crear estructura de carpetas para componentes de landing
2. Definir interfaces TypeScript
3. Crear componentes base sin contenido

### Phase 2: Generación con 21st.dev MCP
1. Generar HeroSection con /iui
2. Generar ProblemsSection con /cui
3. Generar cards de soluciones con /cui
4. Generar BenefitsByRoleSection con /cui
5. Generar PricingSection con /cui
6. Generar FinalCTASection con /iui

### Phase 3: Componentes Custom
1. Implementar SolutionsSection (layout alternado)
2. Implementar FeaturesDetailSection (tabs/accordion)
3. Implementar ComparisonSection (tabla)
4. Implementar TechnologySection
5. Implementar FAQSection (accordion)
6. Mejorar Footer

### Phase 4: Contenido y Datos
1. Crear archivo de contenido (landingContent.ts)
2. Poblar con textos reales
3. Añadir imágenes y screenshots
4. Configurar iconos

### Phase 5: Estilos y Animaciones
1. Aplicar tema de Tailwind
2. Añadir animaciones de scroll
3. Implementar hover effects
4. Optimizar responsive

### Phase 6: Testing y Optimización
1. Testing visual en dispositivos
2. Optimización de performance
3. SEO y meta tags
4. Accesibilidad (a11y)


---

## File Structure

```
src/
├── pages/
│   └── Index.tsx (Landing Page principal)
├── components/
│   └── landing/
│       ├── HeroSection.tsx
│       ├── ProblemsSection.tsx
│       ├── SolutionsSection.tsx
│       ├── FeaturesDetailSection.tsx
│       ├── BenefitsByRoleSection.tsx
│       ├── KeyBenefitsSection.tsx
│       ├── UseCasesSection.tsx
│       ├── ComparisonSection.tsx
│       ├── TechnologySection.tsx
│       ├── PricingSection.tsx
│       ├── FAQSection.tsx
│       ├── FinalCTASection.tsx
│       └── Footer.tsx
├── data/
│   └── landingContent.ts (Contenido de la landing)
└── assets/
    └── landing/
        ├── hero-image.png
        ├── dashboard-screenshot.png
        ├── calendar-screenshot.png
        ├── checkin-screenshot.png
        └── ... (más screenshots)
```

---

## Design Decisions

### ¿Por qué 21st.dev MCP?
- Genera componentes modernos rápidamente
- Estilo profesional y consistente
- Ahorra tiempo en diseño inicial
- Fácil de refinar después

### ¿Por qué enfoque problema-solución?
- Resuena mejor con clientes B2B
- Muestra empatía con sus dolores
- Demuestra valor inmediato
- Inspirado en Basecamp (probado y efectivo)

### ¿Por qué sin métricas inventadas?
- Honestidad y transparencia
- Evita promesas que no podemos cumplir
- Enfoque en beneficios verificables
- Construye confianza real

### ¿Por qué layout alternado en soluciones?
- Mejor legibilidad
- Rompe monotonía visual
- Guía el ojo del usuario
- Estándar en landing pages modernas

### ¿Por qué 3 planes de pricing?
- Estándar de la industria
- Permite comparación fácil
- Plan medio como "recomendado" (efecto ancla)
- Flexibilidad para diferentes tamaños

---

## Accessibility Considerations

- Contraste de colores WCAG AA mínimo
- Navegación por teclado funcional
- Alt text en todas las imágenes
- Headings semánticos (H1, H2, H3)
- ARIA labels en elementos interactivos
- Focus visible en todos los elementos
- Respeto a prefers-reduced-motion
- Tamaños de toque mínimos (44x44px)

---

## Performance Optimizations

- Lazy loading de imágenes
- Code splitting por sección
- Optimización de imágenes (WebP)
- Minificación de CSS/JS
- Preload de recursos críticos
- Defer de scripts no críticos
- CDN para assets estáticos
- Caching de componentes

---

## SEO Strategy

**Meta Tags:**
```html
<title>RESERVEO - Sistema de Gestión de Aparcamiento Corporativo</title>
<meta name="description" content="Gestiona el aparcamiento de tu empresa sin complicaciones. Sistema completo con reservas, check-in, lista de espera y más." />
<meta name="keywords" content="gestión aparcamiento, parking corporativo, reservas parking, sistema parking empresa" />
```

**Open Graph:**
```html
<meta property="og:title" content="RESERVEO - Gestión de Aparcamiento Corporativo" />
<meta property="og:description" content="Sistema inteligente para gestionar el aparcamiento de tu empresa" />
<meta property="og:image" content="/og-image.png" />
<meta property="og:url" content="https://reserveo.vercel.app" />
```

**Structured Data (JSON-LD):**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "RESERVEO",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  }
}
```
