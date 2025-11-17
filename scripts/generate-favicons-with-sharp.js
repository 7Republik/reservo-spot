#!/usr/bin/env node

/**
 * Script para generar favicons usando sharp
 * 
 * Instalación:
 *   npm install --save-dev sharp
 * 
 * Uso:
 *   node scripts/generate-favicons-with-sharp.js
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceLogo = path.join(__dirname, '../public/logo_reserveo.png');
const publicDir = path.join(__dirname, '../public');

async function generateFavicons() {
  try {
    console.log('🎨 Generando favicons desde logo_reserveo.png...\n');

    // 1. Favicon.png (32x32)
    await sharp(sourceLogo)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'favicon.png'));
    console.log('✅ favicon.png (32x32)');

    // 2. Apple Touch Icon (180x180)
    await sharp(sourceLogo)
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png (180x180)');

    // 3. Logo para emails (64x64, optimizado)
    await sharp(sourceLogo)
      .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(publicDir, 'logo-email.png'));
    console.log('✅ logo-email.png (64x64, optimizado)');

    // 4. Favicon 16x16 (para .ico)
    await sharp(sourceLogo)
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'favicon-16x16.png'));
    console.log('✅ favicon-16x16.png (16x16)');

    // 5. Favicon 48x48 (para .ico)
    await sharp(sourceLogo)
      .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(path.join(publicDir, 'favicon-48x48.png'));
    console.log('✅ favicon-48x48.png (48x48)');

    console.log('\n✨ Favicons generados exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Generar favicon.ico desde favicon-16x16.png, favicon.png y favicon-48x48.png');
    console.log('      Usa: https://www.icoconverter.com/');
    console.log('   2. Actualizar index.html con las nuevas referencias');
    console.log('   3. Desplegar a producción');

    // Mostrar tamaños de archivos
    console.log('\n📊 Tamaños de archivos:');
    const files = ['favicon.png', 'apple-touch-icon.png', 'logo-email.png'];
    for (const file of files) {
      const filePath = path.join(publicDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   ${file}: ${sizeKB} KB`);
      }
    }

  } catch (error) {
    console.error('❌ Error generando favicons:', error.message);
    process.exit(1);
  }
}

// Ejecutar generación
generateFavicons();
