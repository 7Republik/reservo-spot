#!/usr/bin/env tsx

/**
 * Script de verificación de accesibilidad
 * 
 * Verifica:
 * - Contraste de colores (WCAG 2.1 AA: 4.5:1 para texto normal, 3:1 para texto grande)
 * - Touch targets mínimos (44x44px)
 * - Aria-labels en botones con solo iconos
 * - Focus states visibles
 * 
 * Uso: npx tsx scripts/verify-accessibility.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Colores del sistema de diseño
const colors = {
  // Primary gradient
  primary: {
    from: '#667eea',
    to: '#764ba2',
  },
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  // Neutral
  foreground: '#000000',
  background: '#ffffff',
  muted: '#6b7280',
};

/**
 * Convierte hex a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Calcula la luminancia relativa
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula el ratio de contraste entre dos colores
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Verifica si el contraste cumple con WCAG AA
 */
function checkContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? 3.0 : 4.5;
  const passes = ratio >= required;

  return { passes, ratio, required };
}

/**
 * Busca archivos TypeScript/React recursivamente
 */
function findFiles(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Ignorar node_modules, dist, build
        if (!['node_modules', 'dist', 'build', '.git'].includes(item)) {
          walk(fullPath);
        }
      } else if (pattern.test(item)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Verifica touch targets en componentes
 */
function checkTouchTargets(content: string, filePath: string): string[] {
  const issues: string[] = [];

  // Buscar botones sin min-h-[44px]
  const buttonRegex = /<Button[^>]*>/g;
  const minHeightRegex = /min-h-\[44px\]|min-h-\[48px\]|min-h-\[52px\]/;

  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const buttonTag = match[0];
    if (!minHeightRegex.test(buttonTag) && !buttonTag.includes('asChild')) {
      issues.push(`${filePath}: Botón sin tamaño mínimo de touch target (44px)`);
    }
  }

  return issues;
}

/**
 * Verifica aria-labels en botones con solo iconos
 */
function checkAriaLabels(content: string, filePath: string): string[] {
  const issues: string[] = [];

  // Buscar botones con iconos pero sin texto ni aria-label
  const buttonWithIconRegex = /<(?:Button|GradientButton)[^>]*>[\s\S]*?<(?:Lucide|Icon|svg)[^>]*>[\s\S]*?<\/(?:Button|GradientButton)>/g;

  let match;
  while ((match = buttonWithIconRegex.exec(content)) !== null) {
    const buttonBlock = match[0];
    
    // Verificar si tiene texto visible
    const hasText = /<\/(?:Lucide|Icon|svg)>[\s\S]*?[a-zA-Z]+/.test(buttonBlock);
    
    // Verificar si tiene aria-label
    const hasAriaLabel = /aria-label=/.test(buttonBlock);

    if (!hasText && !hasAriaLabel) {
      issues.push(`${filePath}: Botón con solo icono sin aria-label`);
    }
  }

  return issues;
}

/**
 * Verifica focus states
 */
function checkFocusStates(content: string, filePath: string): string[] {
  const issues: string[] = [];

  // Buscar elementos interactivos sin focus-visible
  const interactiveRegex = /<(?:button|a|input|select|textarea)[^>]*>/gi;
  const focusRegex = /focus-visible:ring|focus:ring|focus-visible:outline/;

  let match;
  while ((match = interactiveRegex.exec(content)) !== null) {
    const tag = match[0];
    if (!focusRegex.test(tag) && !tag.includes('asChild')) {
      issues.push(`${filePath}: Elemento interactivo sin focus state visible`);
    }
  }

  return issues;
}

/**
 * Main
 */
function main() {
  console.log('🔍 Verificando accesibilidad...\n');

  // 1. Verificar contraste de colores
  console.log('📊 Contraste de colores (WCAG 2.1 AA):');
  console.log('─'.repeat(60));

  const contrastTests = [
    { name: 'Primary gradient (from) sobre blanco', fg: colors.primary.from, bg: colors.background, large: false },
    { name: 'Primary gradient (to) sobre blanco', fg: colors.primary.to, bg: colors.background, large: false },
    { name: 'Success sobre blanco', fg: colors.success, bg: colors.background, large: false },
    { name: 'Warning sobre blanco', fg: colors.warning, bg: colors.background, large: false },
    { name: 'Error sobre blanco', fg: colors.error, bg: colors.background, large: false },
    { name: 'Info sobre blanco', fg: colors.info, bg: colors.background, large: false },
    { name: 'Muted sobre blanco', fg: colors.muted, bg: colors.background, large: false },
    { name: 'Texto grande primary (from)', fg: colors.primary.from, bg: colors.background, large: true },
  ];

  let contrastPassed = 0;
  let contrastFailed = 0;

  for (const test of contrastTests) {
    const result = checkContrast(test.fg, test.bg, test.large);
    const status = result.passes ? '✅' : '❌';
    const textSize = test.large ? '(texto grande)' : '(texto normal)';
    
    console.log(
      `${status} ${test.name} ${textSize}: ${result.ratio.toFixed(2)}:1 (requerido: ${result.required}:1)`
    );

    if (result.passes) {
      contrastPassed++;
    } else {
      contrastFailed++;
    }
  }

  console.log('─'.repeat(60));
  console.log(`Total: ${contrastPassed} ✅ | ${contrastFailed} ❌\n`);

  // 2. Verificar componentes
  console.log('🔧 Verificando componentes:');
  console.log('─'.repeat(60));

  const componentFiles = findFiles('src/components', /\.(tsx|jsx)$/);
  
  let touchTargetIssues: string[] = [];
  let ariaLabelIssues: string[] = [];
  let focusStateIssues: string[] = [];

  for (const file of componentFiles) {
    const content = readFileSync(file, 'utf-8');
    
    touchTargetIssues = touchTargetIssues.concat(checkTouchTargets(content, file));
    ariaLabelIssues = ariaLabelIssues.concat(checkAriaLabels(content, file));
    focusStateIssues = focusStateIssues.concat(checkFocusStates(content, file));
  }

  console.log(`\n📏 Touch targets (44x44px mínimo):`);
  if (touchTargetIssues.length === 0) {
    console.log('✅ Todos los botones tienen tamaño mínimo adecuado');
  } else {
    console.log(`❌ ${touchTargetIssues.length} problemas encontrados:`);
    touchTargetIssues.slice(0, 5).forEach((issue) => console.log(`   - ${issue}`));
    if (touchTargetIssues.length > 5) {
      console.log(`   ... y ${touchTargetIssues.length - 5} más`);
    }
  }

  console.log(`\n🏷️  Aria-labels en botones con iconos:`);
  if (ariaLabelIssues.length === 0) {
    console.log('✅ Todos los botones con iconos tienen aria-label');
  } else {
    console.log(`⚠️  ${ariaLabelIssues.length} posibles problemas encontrados:`);
    ariaLabelIssues.slice(0, 5).forEach((issue) => console.log(`   - ${issue}`));
    if (ariaLabelIssues.length > 5) {
      console.log(`   ... y ${ariaLabelIssues.length - 5} más`);
    }
  }

  console.log(`\n👁️  Focus states visibles:`);
  if (focusStateIssues.length === 0) {
    console.log('✅ Todos los elementos interactivos tienen focus state');
  } else {
    console.log(`⚠️  ${focusStateIssues.length} posibles problemas encontrados:`);
    focusStateIssues.slice(0, 5).forEach((issue) => console.log(`   - ${issue}`));
    if (focusStateIssues.length > 5) {
      console.log(`   ... y ${focusStateIssues.length - 5} más`);
    }
  }

  console.log('\n─'.repeat(60));

  // Resumen final
  const totalIssues = contrastFailed + touchTargetIssues.length + ariaLabelIssues.length + focusStateIssues.length;
  
  if (totalIssues === 0) {
    console.log('\n✅ ¡Todas las verificaciones de accesibilidad pasaron!');
  } else {
    console.log(`\n⚠️  Se encontraron ${totalIssues} problemas de accesibilidad`);
    console.log('\nRecomendaciones:');
    console.log('- Revisar los colores que no cumplen con el contraste mínimo');
    console.log('- Añadir min-h-[44px] a todos los botones');
    console.log('- Añadir aria-label a botones con solo iconos');
    console.log('- Añadir focus-visible:ring-2 a elementos interactivos');
  }

  console.log('\n📚 Referencias:');
  console.log('- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/');
  console.log('- Contrast Checker: https://webaim.org/resources/contrastchecker/');
  console.log('- Touch Targets: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html');
}

main();
