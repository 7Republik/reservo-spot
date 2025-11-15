/**
 * Utilidad para verificar contraste de colores según WCAG 2.1
 * Mínimo 4.5:1 para texto normal
 * Mínimo 3:1 para texto grande (18px+ o 14px+ bold)
 */

/**
 * Convierte un color HSL a RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

/**
 * Calcula la luminancia relativa de un color RGB
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula el ratio de contraste entre dos colores
 */
export function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const lum1 = getLuminance(...color1);
  const lum2 = getLuminance(...color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Verifica si el contraste cumple con WCAG AA
 */
export function meetsWCAG_AA(
  foreground: [number, number, number],
  background: [number, number, number],
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? 3 : 4.5;

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required
  };
}

/**
 * Colores del sistema RESERVEO
 */
export const RESERVEO_COLORS = {
  light: {
    background: hslToRgb(42, 20, 95.6),
    foreground: hslToRgb(234, 17, 24),
    primary: hslToRgb(12, 69, 64),
    primaryForeground: hslToRgb(0, 0, 100),
    secondary: hslToRgb(152, 28, 60),
    secondaryForeground: hslToRgb(0, 0, 100),
    muted: hslToRgb(42, 20, 95.6),
    mutedForeground: hslToRgb(234, 17, 44),
    success: hslToRgb(152, 28, 60),
    successForeground: hslToRgb(0, 0, 100),
    destructive: hslToRgb(12, 63, 53),
    destructiveForeground: hslToRgb(0, 0, 100),
  },
  dark: {
    background: hslToRgb(234, 20, 17),
    foreground: hslToRgb(42, 20, 95.6),
    primary: hslToRgb(12, 69, 64),
    primaryForeground: hslToRgb(42, 20, 95.6),
    secondary: hslToRgb(152, 28, 60),
    secondaryForeground: hslToRgb(42, 20, 95.6),
    muted: hslToRgb(234, 17, 24),
    mutedForeground: hslToRgb(42, 15, 78),
    success: hslToRgb(152, 28, 60),
    successForeground: hslToRgb(234, 17, 24),
    destructive: hslToRgb(12, 63, 53),
    destructiveForeground: hslToRgb(42, 20, 95.6),
  }
};

/**
 * Verifica todos los contrastes del sistema
 */
export function checkAllContrasts() {
  const results: Record<string, any> = {
    light: {},
    dark: {}
  };

  // Light mode
  results.light.foregroundOnBackground = meetsWCAG_AA(
    RESERVEO_COLORS.light.foreground,
    RESERVEO_COLORS.light.background
  );

  results.light.primaryForegroundOnPrimary = meetsWCAG_AA(
    RESERVEO_COLORS.light.primaryForeground,
    RESERVEO_COLORS.light.primary
  );

  results.light.secondaryForegroundOnSecondary = meetsWCAG_AA(
    RESERVEO_COLORS.light.secondaryForeground,
    RESERVEO_COLORS.light.secondary
  );

  results.light.mutedForegroundOnMuted = meetsWCAG_AA(
    RESERVEO_COLORS.light.mutedForeground,
    RESERVEO_COLORS.light.muted
  );

  // Dark mode
  results.dark.foregroundOnBackground = meetsWCAG_AA(
    RESERVEO_COLORS.dark.foreground,
    RESERVEO_COLORS.dark.background
  );

  results.dark.primaryForegroundOnPrimary = meetsWCAG_AA(
    RESERVEO_COLORS.dark.primaryForeground,
    RESERVEO_COLORS.dark.primary
  );

  results.dark.secondaryForegroundOnSecondary = meetsWCAG_AA(
    RESERVEO_COLORS.dark.secondaryForeground,
    RESERVEO_COLORS.dark.secondary
  );

  results.dark.mutedForegroundOnMuted = meetsWCAG_AA(
    RESERVEO_COLORS.dark.mutedForeground,
    RESERVEO_COLORS.dark.muted
  );

  return results;
}

/**
 * Imprime un reporte de contraste en consola
 */
export function printContrastReport() {
  const results = checkAllContrasts();

  console.group('🎨 RESERVEO - Reporte de Contraste WCAG 2.1 AA');
  
  console.group('☀️ Light Mode');
  Object.entries(results.light).forEach(([key, value]: [string, any]) => {
    const icon = value.passes ? '✅' : '❌';
    console.log(`${icon} ${key}: ${value.ratio}:1 (required: ${value.required}:1)`);
  });
  console.groupEnd();

  console.group('🌙 Dark Mode');
  Object.entries(results.dark).forEach(([key, value]: [string, any]) => {
    const icon = value.passes ? '✅' : '❌';
    console.log(`${icon} ${key}: ${value.ratio}:1 (required: ${value.required}:1)`);
  });
  console.groupEnd();

  console.groupEnd();

  return results;
}
