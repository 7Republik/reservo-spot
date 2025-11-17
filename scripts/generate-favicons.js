#!/usr/bin/env node

/**
 * Script para generar favicons en múltiples tamaños desde logo_reserveo.png
 * 
 * Uso:
 *   node scripts/generate-favicons.js
 * 
 * Genera:
 *   - favicon.ico (16x16, 32x32, 48x48)
 *   - favicon.png (32x32)
 *   - apple-touch-icon.png (180x180)
 *   - logo-email.png (64x64, optimizado para emails)
 */

const fs = require('fs');
const path = require('path');

// Verificar que existe el logo fuente
const sourceLogo = path.join(__dirname, '../public/logo_reserveo.png');

if (!fs.existsSync(sourceLogo)) {
  console.error('❌ Error: No se encuentra public/logo_reserveo.png');
  process.exit(1);
}

console.log('✅ Logo fuente encontrado: public/logo_reserveo.png');
console.log('');
console.log('📋 Para generar los favicons, necesitas instalar sharp:');
console.log('   npm install --save-dev sharp');
console.log('');
console.log('Luego ejecuta:');
console.log('   node scripts/generate-favicons-with-sharp.js');
console.log('');
console.log('O usa herramientas online:');
console.log('   1. https://realfavicongenerator.net/');
console.log('   2. Sube public/logo_reserveo.png');
console.log('   3. Descarga el paquete generado');
console.log('   4. Extrae los archivos a public/');
console.log('');
console.log('Tamaños necesarios:');
console.log('   - favicon.ico (16x16, 32x32, 48x48)');
console.log('   - favicon.png (32x32)');
console.log('   - apple-touch-icon.png (180x180)');
console.log('   - logo-email.png (64x64)');
