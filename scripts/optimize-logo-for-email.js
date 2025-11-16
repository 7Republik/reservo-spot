#!/usr/bin/env node

/**
 * Script para optimizar logo para emails
 * Redimensiona a 64x64px y comprime a < 10KB
 * 
 * Uso: node scripts/optimize-logo-for-email.js <ruta-al-logo>
 * 
 * Ejemplo:
 *   node scripts/optimize-logo-for-email.js logo-original.png
 *   node scripts/optimize-logo-for-email.js ~/Downloads/logo.png
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener ruta del logo desde argumentos
const logoPath = process.argv[2];

if (!logoPath) {
  console.error('\n❌ Error: Debes proporcionar la ruta al logo\n');
  console.log('Uso:');
  console.log('  node scripts/optimize-logo-for-email.js <ruta-al-logo>\n');
  console.log('Ejemplo:');
  console.log('  node scripts/optimize-logo-for-email.js logo-original.png');
  console.log('  node scripts/optimize-logo-for-email.js ~/Downloads/logo.png\n');
  process.exit(1);
}

// Verificar que el archivo existe
if (!fs.existsSync(logoPath)) {
  console.error(`\n❌ Error: El archivo no existe: ${logoPath}\n`);
  process.exit(1);
}

// Verificar que sharp está instalado
let sharp;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default;
} catch (err) {
  console.error('\n❌ Error: Sharp no está instalado\n');
  console.log('Instalar con:');
  console.log('  npm install sharp\n');
  console.log('O usar método online:');
  console.log('  1. Ir a https://tinypng.com/');
  console.log('  2. Subir tu logo');
  console.log('  3. Descargar optimizado');
  console.log('  4. Guardar como: public/logo-email.png\n');
  process.exit(1);
}

const outputPath = path.join(__dirname, '..', 'public', 'logo-email.png');

console.log('\n🔄 Optimizando logo para emails...\n');
console.log('📂 Archivo original:', logoPath);
console.log('📍 Destino:', outputPath);

// Obtener información del archivo original
const originalStats = fs.statSync(logoPath);
console.log('📊 Tamaño original:', (originalStats.size / 1024).toFixed(2), 'KB\n');

// Optimizar logo
(async () => {
  try {
    const info = await sharp(logoPath)
  .resize(64, 64, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .png({
    quality: 90,
    compressionLevel: 9,
    palette: true,
    effort: 10
  })
      .toFile(outputPath);

    const finalSize = info.size / 1024;
    const reduction = ((1 - info.size / originalStats.size) * 100).toFixed(1);
    
    console.log('✅ Logo optimizado exitosamente!\n');
    console.log('📊 Resultados:');
    console.log('   Dimensiones:', info.width, 'x', info.height, 'px');
    console.log('   Tamaño final:', finalSize.toFixed(2), 'KB');
    console.log('   Reducción:', reduction, '%');
    console.log('   Formato:', info.format.toUpperCase());
    
    // Verificar si el tamaño es aceptable
    if (finalSize > 10) {
      console.log('\n⚠️  ADVERTENCIA: El logo es > 10KB');
      console.log('   Recomendación: Simplificar el diseño o reducir colores');
      console.log('   Alternativa: Usar https://tinypng.com/ para más compresión\n');
    } else if (finalSize > 5) {
      console.log('\n✅ Tamaño aceptable (5-10KB)');
      console.log('   Tip: Podrías reducir más con https://tinypng.com/\n');
    } else {
      console.log('\n🎉 ¡Tamaño perfecto! (< 5KB)\n');
    }
    
    console.log('📝 Próximos pasos:');
    console.log('1. Verificar visualmente:');
    console.log('   open public/logo-email.png');
    console.log('\n2. Desplegar a Vercel:');
    console.log('   git add public/logo-email.png');
    console.log('   git commit -m "feat: add optimized email logo"');
    console.log('   git push');
    console.log('\n3. Verificar URL (después del deploy):');
    console.log('   curl -I https://reserveo.app/logo-email.png');
    console.log('\n4. Probar en email:');
    console.log('   Ver: QUICK-START-EMAIL-LOGO.md\n');
    
  } catch (err) {
    console.error('\n❌ Error al optimizar logo:', err.message);
    console.log('\nAlternativas:');
    console.log('1. Usar método online:');
    console.log('   https://tinypng.com/');
    console.log('\n2. Usar ImageMagick:');
    console.log('   convert', logoPath, '-resize 64x64 -quality 85', outputPath);
    console.log('\n3. Verificar que el archivo es una imagen válida\n');
    process.exit(1);
  }
})();
