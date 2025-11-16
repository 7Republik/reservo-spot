#!/usr/bin/env node

/**
 * Script para convertir el logo de Reserveo a base64
 * Uso: node scripts/convert-logo-to-base64.js <ruta-al-logo>
 * 
 * Ejemplo:
 *   node scripts/convert-logo-to-base64.js public/logo.png
 *   node scripts/convert-logo-to-base64.js public/logo.svg
 */

const fs = require('fs');
const path = require('path');

// Obtener ruta del logo desde argumentos
const logoPath = process.argv[2];

if (!logoPath) {
  console.error('❌ Error: Debes proporcionar la ruta al logo');
  console.log('\nUso:');
  console.log('  node scripts/convert-logo-to-base64.js <ruta-al-logo>');
  console.log('\nEjemplo:');
  console.log('  node scripts/convert-logo-to-base64.js public/logo.png');
  console.log('  node scripts/convert-logo-to-base64.js public/logo.svg');
  process.exit(1);
}

// Verificar que el archivo existe
if (!fs.existsSync(logoPath)) {
  console.error(`❌ Error: El archivo no existe: ${logoPath}`);
  process.exit(1);
}

// Leer el archivo
const logoBuffer = fs.readFileSync(logoPath);
const ext = path.extname(logoPath).toLowerCase();

// Determinar MIME type
let mimeType;
switch (ext) {
  case '.png':
    mimeType = 'image/png';
    break;
  case '.jpg':
  case '.jpeg':
    mimeType = 'image/jpeg';
    break;
  case '.svg':
    mimeType = 'image/svg+xml';
    break;
  case '.gif':
    mimeType = 'image/gif';
    break;
  default:
    console.error(`❌ Error: Formato no soportado: ${ext}`);
    console.log('Formatos soportados: .png, .jpg, .jpeg, .svg, .gif');
    process.exit(1);
}

// Convertir a base64
const base64 = logoBuffer.toString('base64');
const dataUri = `data:${mimeType};base64,${base64}`;

// Mostrar información
console.log('\n✅ Logo convertido exitosamente!\n');
console.log('📊 Información:');
console.log(`   Archivo: ${path.basename(logoPath)}`);
console.log(`   Formato: ${ext}`);
console.log(`   MIME Type: ${mimeType}`);
console.log(`   Tamaño original: ${(logoBuffer.length / 1024).toFixed(2)} KB`);
console.log(`   Tamaño base64: ${(dataUri.length / 1024).toFixed(2)} KB`);

// Advertencia si el tamaño es muy grande
if (dataUri.length > 50000) {
  console.log('\n⚠️  ADVERTENCIA: El logo es muy grande (>50KB)');
  console.log('   Recomendación: Optimiza el logo a 48x48px o 64x64px');
  console.log('   Herramientas: https://tinypng.com/ o https://jakearchibald.github.io/svgomg/');
}

// Mostrar el data URI
console.log('\n📋 Data URI (copia esto):');
console.log('─'.repeat(80));
console.log(dataUri);
console.log('─'.repeat(80));

// Mostrar instrucciones
console.log('\n📝 Instrucciones:');
console.log('1. Copia el Data URI de arriba');
console.log('2. Abre: supabase/functions/send-notification/index.ts');
console.log('3. Busca la línea: const logoBase64 = ...');
console.log('4. Reemplaza el valor con el Data URI copiado');
console.log('5. Guarda el archivo');
console.log('6. Despliega la función: supabase functions deploy send-notification');

// Guardar en archivo temporal
const outputPath = path.join(__dirname, 'logo-base64.txt');
fs.writeFileSync(outputPath, dataUri);
console.log(`\n💾 También guardado en: ${outputPath}`);

console.log('\n✨ ¡Listo!\n');
