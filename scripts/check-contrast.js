/**
 * Script para verificar contraste de colores WCAG 2.1 AA
 */

function hslToRgb(h, s, l) {
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

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(...color1);
  const lum2 = getLuminance(...color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

function meetsWCAG_AA(foreground, background, isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? 3 : 4.5;

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required
  };
}

const COLORS = {
  light: {
    background: hslToRgb(42, 20, 95.6),
    foreground: hslToRgb(234, 17, 24),
    primary: hslToRgb(12, 69, 48),
    primaryForeground: hslToRgb(0, 0, 100),
    secondary: hslToRgb(152, 52, 34),
    secondaryForeground: hslToRgb(0, 0, 100),
    muted: hslToRgb(42, 20, 95.6),
    mutedForeground: hslToRgb(234, 17, 44),
  },
  dark: {
    background: hslToRgb(234, 20, 17),
    foreground: hslToRgb(42, 20, 95.6),
    primary: hslToRgb(12, 69, 48),
    primaryForeground: hslToRgb(0, 0, 100),
    secondary: hslToRgb(152, 54, 34),
    secondaryForeground: hslToRgb(0, 0, 100),
    muted: hslToRgb(234, 17, 24),
    mutedForeground: hslToRgb(42, 15, 78),
  }
};

console.log('\n🎨 RESERVEO - Reporte de Contraste WCAG 2.1 AA\n');

console.log('☀️  Light Mode:');
const lightFg = meetsWCAG_AA(COLORS.light.foreground, COLORS.light.background);
console.log(`  ${lightFg.passes ? '✅' : '❌'} foreground/background: ${lightFg.ratio}:1 (required: ${lightFg.required}:1)`);

const lightPrimary = meetsWCAG_AA(COLORS.light.primaryForeground, COLORS.light.primary);
console.log(`  ${lightPrimary.passes ? '✅' : '❌'} primary-foreground/primary: ${lightPrimary.ratio}:1 (required: ${lightPrimary.required}:1)`);

const lightSecondary = meetsWCAG_AA(COLORS.light.secondaryForeground, COLORS.light.secondary);
console.log(`  ${lightSecondary.passes ? '✅' : '❌'} secondary-foreground/secondary: ${lightSecondary.ratio}:1 (required: ${lightSecondary.required}:1)`);

const lightMuted = meetsWCAG_AA(COLORS.light.mutedForeground, COLORS.light.muted);
console.log(`  ${lightMuted.passes ? '✅' : '❌'} muted-foreground/muted: ${lightMuted.ratio}:1 (required: ${lightMuted.required}:1)`);

console.log('\n🌙 Dark Mode:');
const darkFg = meetsWCAG_AA(COLORS.dark.foreground, COLORS.dark.background);
console.log(`  ${darkFg.passes ? '✅' : '❌'} foreground/background: ${darkFg.ratio}:1 (required: ${darkFg.required}:1)`);

const darkPrimary = meetsWCAG_AA(COLORS.dark.primaryForeground, COLORS.dark.primary);
console.log(`  ${darkPrimary.passes ? '✅' : '❌'} primary-foreground/primary: ${darkPrimary.ratio}:1 (required: ${darkPrimary.required}:1)`);

const darkSecondary = meetsWCAG_AA(COLORS.dark.secondaryForeground, COLORS.dark.secondary);
console.log(`  ${darkSecondary.passes ? '✅' : '❌'} secondary-foreground/secondary: ${darkSecondary.ratio}:1 (required: ${darkSecondary.required}:1)`);

const darkMuted = meetsWCAG_AA(COLORS.dark.mutedForeground, COLORS.dark.muted);
console.log(`  ${darkMuted.passes ? '✅' : '❌'} muted-foreground/muted: ${darkMuted.ratio}:1 (required: ${darkMuted.required}:1)`);

console.log('\n');
