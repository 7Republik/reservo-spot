#!/usr/bin/env node

/**
 * Script para generar un logo placeholder SVG optimizado
 * Útil mientras no tienes el logo final de Reserveo
 * 
 * Uso: node scripts/generate-placeholder-logo.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logo SVG optimizado (64x64px, < 1KB)
const logoSVG = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo con gradiente -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Rectángulo redondeado con gradiente -->
  <rect width="64" height="64" rx="12" fill="url(#grad)"/>
  
  <!-- Letra P estilizada -->
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">P</text>
  
  <!-- Opcional: Añadir un círculo decorativo -->
  <circle cx="48" cy="16" r="4" fill="white" opacity="0.3"/>
</svg>`;

// Ruta de salida
const outputPath = path.join(__dirname, '..', 'public', 'logo-email.svg');

// Crear directorio si no existe
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Guardar SVG
fs.writeFileSync(outputPath, logoSVG);

console.log('\n✅ Logo placeholder generado exitosamente!\n');
console.log('📍 Ubicación:', outputPath);
console.log('📊 Tamaño:', (logoSVG.length / 1024).toFixed(2), 'KB');
console.log('🎨 Dimensiones: 64x64px');
console.log('🌈 Colores: Gradiente purple → violet (#667eea → #764ba2)');

console.log('\n📝 Próximos pasos:');
console.log('1. Revisar el logo en: public/logo-email.svg');
console.log('2. Si te gusta, convertir a PNG:');
console.log('   - Abrir en navegador y hacer screenshot');
console.log('   - O usar: https://svgtopng.com/');
console.log('   - Guardar como: public/logo-email.png');
console.log('3. Optimizar PNG con: https://tinypng.com/');
console.log('4. Desplegar a Vercel');
console.log('5. Verificar: https://reserveo.app/logo-email.png');

console.log('\n💡 Tip: Este es un placeholder. Reemplázalo con tu logo real cuando lo tengas.');
console.log('\n');

// También generar versión PNG si sharp está disponible
(async () => {
  try {
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default;
    
    const pngPath = path.join(__dirname, '..', 'public', 'logo-email.png');
    
    await sharp(Buffer.from(logoSVG))
      .resize(64, 64)
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(pngPath);
    
    console.log('✅ También generado PNG automáticamente!');
    console.log('📍 Ubicación:', pngPath);
    console.log('\n🚀 ¡Listo para usar! Solo despliega a Vercel.\n');
  } catch (err) {
    console.log('ℹ️  Para generar PNG automáticamente, instala sharp:');
    console.log('   npm install sharp');
    console.log('   node scripts/generate-placeholder-logo.js\n');
  }
})();
