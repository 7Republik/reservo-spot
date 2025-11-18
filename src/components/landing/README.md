# Componentes de Landing Page

Esta carpeta contiene todos los componentes de la landing page comercial de RESERVEO.

## Estado de Implementación

### ✅ Componentes Completados e Integrados

Los siguientes componentes están implementados y **ya integrados en Index.tsx**:

1. **HeroSection** - Hero principal con glassmorphism
2. **ProblemsSection** - Grid de problemas comunes
3. **SolutionsSection** - Layout alternado de soluciones
4. **FeaturesDetailSection** - Tabs de características detalladas
5. **BenefitsByRoleSection** - Beneficios por rol
6. **UseCasesSection** - Casos de uso por industria
7. **PricingSection** - Planes de pricing
8. **FAQSection** - Preguntas frecuentes con accordion
9. **FinalCTASection** - CTA final persuasivo
10. **Footer** - Footer completo con links

### ❌ Componentes Pendientes

- KeyBenefitsSection - Beneficios clave destacados
- ComparisonSection - Comparación manual vs RESERVEO
- TechnologySection - Stack tecnológico y seguridad

## Integración en Index.tsx ✅

Todos los componentes están integrados en `src/pages/Index.tsx` con:

```tsx
import { landingContent } from "@/data/landingContent";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemsSection } from "@/components/landing/ProblemsSection";
// ... más imports

const Index = () => {
  const navigate = useNavigate();

  return (
    <div>
      <section id="hero"><HeroSection {...props} /></section>
      <section id="problems"><ProblemsSection /></section>
      <section id="solutions"><SolutionsSection {...props} /></section>
      <section id="features"><FeaturesDetailSection {...props} /></section>
      <section id="benefits"><BenefitsByRoleSection {...props} /></section>
      <section id="use-cases"><UseCasesSection {...props} /></section>
      <section id="pricing"><PricingSection {...props} /></section>
      <section id="faq"><FAQSection /></section>
      <section id="cta"><FinalCTASection {...props} /></section>
      <Footer {...props} />
    </div>
  );
};
```

## Scroll Suave ✅

Configurado en `src/styles/landing.css`:

```css
/* Scroll suave global */
html {
  scroll-behavior: smooth;
}

/* Offset para secciones */
section[id] {
  scroll-margin-top: 2rem;
}

/* Respeto a prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

### Navegación entre secciones:

```tsx
// Desde cualquier componente
document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
```

## Componentes Detallados

### HeroSection

Sección principal (hero) de la landing page con diseño glassmorphism y gradientes animados.

**Props:**
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

**Características:**
- Diseño moderno con efectos glassmorphism
- Gradientes animados de fondo
- Animaciones de entrada con framer-motion
- Responsive (mobile, tablet, desktop)

---

### ProblemsSection

Grid de problemas comunes que enfrentan las empresas.

**Props:**
```typescript
// No requiere props - usa landingContent.problems directamente
```

**Características:**
- Grid 2x3 de problemas
- Cards con iconos de alerta
- Hover effects
- Estilo con acentos rojos/naranjas

---

### SolutionsSection

Layout alternado para mostrar las 8 funcionalidades principales.

**Props:**
```typescript
interface SolutionsSectionProps {
  title: string;
  solutions: Solution[];
}
```

**Características:**
- Layout alternado (imagen izquierda/derecha)
- 8 soluciones incluidas
- Lista de beneficios con checkmarks
- Responsive (stack en mobile)

---

### FeaturesDetailSection

Tabs para mostrar características detalladas de cada módulo.

**Props:**
```typescript
interface FeaturesDetailSectionProps {
  modules: Module[];
}
```

**Características:**
- Tabs horizontales para 6 módulos
- Grid de 2 columnas para características
- Badges para "Nuevo" y "Popular"
- Responsive

---

### BenefitsByRoleSection

Beneficios específicos por rol de usuario.

**Props:**
```typescript
interface BenefitsByRoleSectionProps {
  title: string;
  subtitle?: string;
  roleBenefits: RoleBenefit[];
}
```

**Características:**
- 3 columnas para roles (Empleados, Admins, Directores)
- Colores diferenciados por rol
- Quotes representativos

---

### UseCasesSection

Casos de uso por industria.

**Props:**
```typescript
interface UseCasesSectionProps {
  title: string;
  useCases: UseCase[];
}
```

**Características:**
- Grid de 4 casos de uso
- Iconos representativos
- Hover effects

---

### PricingSection

Planes de pricing con 3 tiers.

**Props:**
```typescript
interface PricingSectionProps {
  tiers: PricingTier[];
}
```

**Características:**
- 3 planes (Starter, Professional, Enterprise)
- Plan central destacado
- CTA "Contactar para Precio"

---

### FAQSection

Preguntas frecuentes con accordion.

**Props:**
```typescript
// No requiere props - usa landingContent.faqs directamente
```

**Características:**
- Accordion con 8 preguntas
- Solo una expandida a la vez
- CTA al final para contacto

---

### FinalCTASection

CTA final persuasivo para conversión.

**Props:**
```typescript
interface FinalCTASectionProps {
  headline: string;
  subheadline?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}
```

**Características:**
- Headline bold y persuasivo
- 2 CTAs prominentes
- Background con gradiente animado
- Trust badges

---

### Footer

Footer completo con links organizados.

**Props:**
```typescript
interface FooterProps {
  columns: FooterColumn[];
  socialLinks: { platform: string; url: string }[];
}
```

**Características:**
- 4 columnas (Producto, Empresa, Legal, Contacto)
- Logo de RESERVEO
- Redes sociales
- Copyright y créditos

---

## Estructura de Datos

Todo el contenido está centralizado en `src/data/landingContent.ts`:

```typescript
export const landingContent = {
  hero: { headline, subheadline, microclaim, imageUrl },
  problems: Problem[],
  solutions: Solution[],
  modules: Module[],
  roleBenefits: RoleBenefit[],
  keyBenefits: KeyBenefit[],
  useCases: UseCase[],
  comparisons: ComparisonRow[],
  technologies: Technology[],
  securityFeatures: SecurityFeature[],
  pricingTiers: PricingTier[],
  faqs: FAQ[],
  finalCTA: { headline, subheadline },
  footer: { columns, socialLinks }
};
```

## Estilos

Los componentes usan:
- **Tailwind CSS** para estilos
- **Tokens semánticos** (bg-primary, text-foreground, etc.)
- **Glassmorphism effects**
- **Animaciones suaves** con `src/styles/landing.css`
- **Responsive design** (mobile-first)
- **Framer Motion** para animaciones avanzadas

## Convenciones

### Naming
- Componentes en PascalCase: `HeroSection.tsx`
- Ejemplos con sufijo: `HeroSection.example.tsx`
- Props interface exportada: `HeroSectionProps`

### Estilos
- Usar Tailwind CSS con tokens semánticos
- Evitar colores hardcoded
- Responsive mobile-first
- Respeto a `prefers-reduced-motion`

### Props
- Siempre definir interface TypeScript
- Exportar interface para reutilización
- Documentar props con comentarios
- Valores por defecto cuando sea apropiado

### Contenido
- Contenido centralizado en `src/data/landingContent.ts`
- No hardcodear textos en componentes
- Usar props para todo el contenido dinámico

## Testing

Para probar los componentes:

1. ✅ Componentes ya integrados en `src/pages/Index.tsx`
2. ✅ Props conectados a `landingContent.ts`
3. ✅ Scroll suave configurado
4. Verificar responsive en diferentes tamaños
5. Probar animaciones y transiciones
6. Verificar accesibilidad (navegación por teclado, alt text)

## Referencias

- [Design Document](.kiro/specs/03-landing-page-comercial/design.md)
- [Requirements](.kiro/specs/03-landing-page-comercial/requirements.md)
- [Tasks](.kiro/specs/03-landing-page-comercial/tasks.md)
- [Landing Content](../../data/landingContent.ts)
- [Index.tsx](../../pages/Index.tsx)
- [Landing CSS](../../styles/landing.css)
