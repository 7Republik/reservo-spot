# Implementation Plan - Landing Page Comercial

## Task Overview

Este plan implementa la nueva landing page comercial de RESERVEO con enfoque B2B, usando 21st.dev MCP para generar secciones modernas y componentes custom para funcionalidad específica.

---

## Tasks

- [x] 1. Preparar estructura y configuración inicial
- [x] 1.1 Crear carpeta `src/components/landing/` para componentes de landing
  - Crear estructura de carpetas
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13_

- [x] 1.2 Crear archivo `src/data/landingContent.ts` con contenido de la landing
  - Definir interfaces TypeScript para contenido
  - Poblar con textos reales en español
  - Incluir todos los datos necesarios (problemas, soluciones, FAQs, etc.)
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11_

- [x] 1.3 Preparar assets necesarios (screenshots, logos)
  - Crear carpeta `src/assets/landing/`
  - Tomar screenshots del dashboard, calendario, check-in
  - Optimizar imágenes (WebP, compresión)
  - _Requirements: 1, 3, 14_

- [x] 2. Generar HeroSection con 21st.dev MCP
- [x] 2.1 Usar MCP para generar HeroSection moderna
  - Ejecutar prompt de 21st.dev: `/iui Create a hero section for corporate parking management`
  - Incluir headline, subheadline, 2 CTAs, microclaim
  - Estilo glassmorphism con gradiente
  - _Requirements: 1_

- [x] 2.2 Integrar HeroSection generado en `src/components/landing/HeroSection.tsx`
  - Copiar código generado
  - Adaptar props interface
  - Conectar con landingContent.ts
  - Configurar navegación de CTAs
  - _Requirements: 1_

- [x] 2.3 Añadir imagen/screenshot del dashboard al hero
  - Integrar imagen desde assets
  - Configurar responsive (ocultar en mobile si necesario)
  - _Requirements: 1_

- [x] 3. Generar ProblemsSection con 21st.dev MCP
- [x] 3.1 Usar MCP para generar sección de problemas
  - Ejecutar prompt: `/cui Create problems section with 6 cards in grid`
  - Grid 2x3 con iconos de alerta
  - Estilo con acentos rojos/naranjas
  - _Requirements: 2_

- [x] 3.2 Integrar ProblemsSection en `src/components/landing/ProblemsSection.tsx`
  - Copiar código generado
  - Adaptar con iconos de Lucide React
  - Conectar con landingContent.ts
  - _Requirements: 2_

- [x] 4. Implementar SolutionsSection (layout alternado)
- [x] 4.1 Crear componente base `src/components/landing/SolutionsSection.tsx`
  - Layout alternado (imagen izquierda/derecha)
  - 8 subsecciones para funcionalidades
  - Responsive (stack en mobile)
  - _Requirements: 3_

- [x] 4.2 Generar cards de solución con 21st.dev MCP
  - Ejecutar prompt: `/cui Create feature section with alternating layout`
  - Generar para cada funcionalidad (Reservas, Check-in, Waitlist, etc.)
  - Adaptar y combinar en SolutionsSection
  - _Requirements: 3_

- [x] 4.3 Añadir screenshots de cada funcionalidad
  - Integrar imágenes desde assets
  - Configurar posición alternada
  - _Requirements: 3_

- [x] 5. Implementar FeaturesDetailSection (tabs o accordion)
- [x] 5.1 Decidir entre tabs o accordion según diseño
  - Evaluar mejor UX para 6 módulos
  - Implementar componente base
  - _Requirements: 4_

- [x] 5.2 Generar estructura con MCP shadcn como ayuda
  - Ejecutar prompt: `/cui Create tabbed section showing detailed features`
  - 6 tabs/accordions para módulos
  - Lista de características con checkmarks
  - _Requirements: 4_

- [x] 5.3 Integrar en `src/components/landing/FeaturesDetailSection.tsx`
  - Copiar código generado
  - Añadir badges ("Nuevo", "Popular")
  - Conectar con landingContent.ts
  - _Requirements: 4_

- [x] 6. Generar BenefitsByRoleSection con shadcn.dev MCP
- [x] 6.1 Usar MCP para generar sección de beneficios por rol
  - Ejecutar prompt: `/cui Create benefits section with 3 columns for user roles`
  - 3 columnas (Empleados, Admins, Directores)
  - Colores diferenciados
  - _Requirements: 5_

- [x] 6.2 Integrar en `src/components/landing/BenefitsByRoleSection.tsx`
  - Copiar código generado
  - Añadir quotes representativos
  - Conectar con landingContent.ts
  - _Requirements: 5_

- [x] 7. Generar KeyBenefitsSection con shadcn MCP
- [x] 7.1 Usar MCP para generar sección de beneficios clave
  - Ejecutar prompt: `/cui Create benefits section with 4 large cards`
  - 4 beneficios verificables
  - Iconos animados en hover
  - _Requirements: 6_

- [x] 7.2 Integrar en `src/components/landing/KeyBenefitsSection.tsx`
  - Copiar código generado
  - Configurar iconos de Lucide React
  - Conectar con landingContent.ts
  - _Requirements: 6_

- [x] 8. Generar UseCasesSection con shadcn MCP
- [x] 8.1 Usar MCP para generar sección de casos de uso
  - Ejecutar prompt: `/cui Create use cases section with 4 cards`
  - 4 industrias (Oficinas, Hospitales, Universidades, Retail)
  - Iconos representativos
  - _Requirements: 7_

- [x] 8.2 Integrar en `src/components/landing/UseCasesSection.tsx`
  - Copiar código generado
  - Conectar con landingContent.ts
  - _Requirements: 7_

- [x] 9. Implementar ComparisonSection (tabla)
- [x] 9.1 Generar tabla de comparación con shadcn MCP
  - Ejecutar prompt: `/cui Create comparison table Manual vs RESERVEO`
  - 6 filas de comparación
  - Iconos X y checkmarks
  - _Requirements: 8_

- [x] 9.2 Integrar en `src/components/landing/ComparisonSection.tsx`
  - Copiar código generado
  - Configurar colores contrastantes
  - Conectar con landingContent.ts
  - _Requirements: 8_

- [x] 10. Implementar TechnologySection
- [x] 10.1 Crear componente `src/components/landing/TechnologySection.tsx`
  - Grid de logos de tecnologías
  - Lista de características de seguridad
  - Layout en 2 subsecciones
  - _Requirements: 9_

- [x] 10.2 Añadir logos de tecnologías
  - React, TypeScript, Supabase, Vercel, Tailwind
  - Usar logos oficiales
  - _Requirements: 9_

- [x] 11. Generar PricingSection con shadcn MCP
- [x] 11.1 Usar MCP para generar sección de pricing
  - Ejecutar prompt: `/cui Create pricing section with 3 tiers`
  - 3 planes (Starter, Professional, Enterprise)
  - Plan central destacado
  - CTA "Contactar para Precio"
  - _Requirements: 10_

- [x] 11.2 Integrar en `src/components/landing/PricingSection.tsx`
  - Copiar código generado
  - Conectar con landingContent.ts
  - _Requirements: 10_

- [x] 12. Implementar FAQSection (accordion)
- [x] 12.1 Generar accordion con shadcn MCP
  - Ejecutar prompt: `/cui Create FAQ section with accordion`
  - 8 preguntas frecuentes
  - Solo una expandida a la vez
  - _Requirements: 11_

- [x] 12.2 Integrar en `src/components/landing/FAQSection.tsx`
  - Copiar código generado
  - Configurar lógica de accordion
  - Conectar con landingContent.ts
  - _Requirements: 11_

- [x] 13. Generar FinalCTASection con shadcn MCP
- [x] 13.1 Usar MCP para generar CTA final potente
  - Ejecutar prompt: `/iui Create final CTA section with bold headline`
  - Headline persuasivo
  - 2 CTAs prominentes
  - Background con gradiente
  - _Requirements: 12_

- [x] 13.2 Integrar en `src/components/landing/FinalCTASection.tsx`
  - Copiar código generado
  - Configurar navegación de CTAs
  - Opcional: añadir formulario de contacto simple
  - _Requirements: 12_

- [x] 14. Mejorar Footer
- [x] 14.1 Actualizar `src/components/landing/Footer.tsx`
  - 4 columnas (Producto, Empresa, Legal, Contacto)
  - Logo de RESERVEO
  - Links organizados
  - Redes sociales
  - _Requirements: 13_

- [x] 14.2 Configurar links del footer
  - Crear páginas placeholder si necesario
  - Configurar navegación
  - _Requirements: 13_

- [x] 15. Integrar todos los componentes en Index.tsx
- [x] 15.1 Actualizar `src/pages/Index.tsx` con nueva estructura
  - Importar todos los componentes de landing
  - Ordenar secciones según diseño
  - Pasar props desde landingContent.ts
  - _Requirements: 1-13_

- [x] 15.2 Configurar scroll suave entre secciones
  - Añadir IDs a secciones
  - Configurar navegación con scroll suave
  - _Requirements: 15_

- [x] 16. Añadir animaciones y microinteracciones
- [x] 16.1 Implementar animaciones de scroll (fade-in, slide-in)
  - Usar Intersection Observer o librería (framer-motion)
  - Animar elementos al entrar en viewport
  - _Requirements: 15_

- [x] 16.2 Añadir hover effects en cards y botones
  - Transiciones suaves
  - Elevación en hover
  - _Requirements: 15_

- [x] 16.3 Respetar prefers-reduced-motion
  - Detectar preferencia del usuario
  - Desactivar animaciones si necesario
  - _Requirements: 15_

- [x] 17. Optimizar responsive design
- [x] 17.1 Verificar y ajustar responsive en mobile
  - Probar en diferentes tamaños (320px, 375px, 414px)
  - Ajustar grids y layouts
  - _Requirements: 14_

- [x] 17.2 Verificar y ajustar responsive en tablet
  - Probar en 768px, 1024px
  - Ajustar columnas y espaciados
  - _Requirements: 14_

- [x] 17.3 Optimizar para desktop grande
  - Probar en 1440px, 1920px
  - Limitar ancho máximo de contenido
  - _Requirements: 14_

- [x] 18. Implementar SEO y meta tags
- [x] 18.1 Añadir meta tags en `index.html` o componente Head
  - Title, description, keywords
  - Open Graph tags
  - Twitter Card tags
  - _Requirements: 14_

- [x] 18.2 Añadir structured data (JSON-LD)
  - Schema.org para SoftwareApplication
  - Incluir en head del documento
  - _Requirements: 14_

- [x] 18.3 Verificar headings semánticos
  - Un solo H1 (en hero)
  - H2 para títulos de sección
  - H3 para subtítulos
  - _Requirements: 14_

- [x] 18.4 Añadir alt text a todas las imágenes
  - Descripciones descriptivas
  - Incluir keywords relevantes
  - _Requirements: 14_

- [ ] 19. Testing y validación
- [ ]* 19.1 Testing visual en diferentes navegadores
  - Chrome, Firefox, Safari
  - Verificar compatibilidad
  - _Requirements: 14, 15_

- [ ]* 19.2 Testing de accesibilidad
  - Navegación por teclado
  - Contraste de colores (WCAG AA)
  - Screen reader friendly
  - _Requirements: 14_

- [ ]* 19.3 Testing de performance
  - Lighthouse score > 90
  - Optimizar imágenes si necesario
  - Verificar tiempo de carga < 3s
  - _Requirements: 14_

- [ ] 20. Ajustes finales y pulido
- [ ] 20.1 Revisar textos y copy
  - Verificar ortografía
  - Mejorar mensajes si necesario
  - _Requirements: 1-13_

- [ ] 20.2 Ajustar colores y espaciados
  - Consistencia visual
  - Usar tokens de diseño
  - _Requirements: 1-13_

- [ ] 20.3 Verificar funcionamiento de todos los CTAs
  - Navegación correcta
  - Formularios funcionando
  - _Requirements: 1, 12_
