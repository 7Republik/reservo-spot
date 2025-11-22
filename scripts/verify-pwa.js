#!/usr/bin/env node

/**
 * Script de verificación de configuración PWA
 * 
 * Verifica que todos los archivos necesarios para la PWA estén presentes
 * y correctamente configurados.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔍 Verificando configuración de PWA...\n');

let errors = 0;
let warnings = 0;

// Verificar manifest.json
console.log('📄 Verificando manifest.json...');
const manifestPath = path.join(rootDir, 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Verificar campos requeridos
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    requiredFields.forEach(field => {
      if (!manifest[field]) {
        console.error(`  ❌ Falta campo requerido: ${field}`);
        errors++;
      } else {
        console.log(`  ✅ ${field}: ${typeof manifest[field] === 'object' ? 'configurado' : manifest[field]}`);
      }
    });
    
    // Verificar start_url
    if (manifest.start_url !== '/dashboard') {
      console.warn(`  ⚠️  start_url debería ser "/dashboard", es: ${manifest.start_url}`);
      warnings++;
    }
    
    // Verificar display
    if (manifest.display !== 'standalone') {
      console.warn(`  ⚠️  display debería ser "standalone", es: ${manifest.display}`);
      warnings++;
    }
    
    // Verificar iconos
    if (manifest.icons && manifest.icons.length > 0) {
      console.log(`  ✅ ${manifest.icons.length} iconos configurados`);
      manifest.icons.forEach(icon => {
        const iconPath = path.join(rootDir, 'public', icon.src);
        if (!fs.existsSync(iconPath)) {
          console.error(`  ❌ Icono no encontrado: ${icon.src}`);
          errors++;
        }
      });
    } else {
      console.error('  ❌ No hay iconos configurados');
      errors++;
    }
    
  } catch (error) {
    console.error(`  ❌ Error al parsear manifest.json: ${error.message}`);
    errors++;
  }
} else {
  console.error('  ❌ manifest.json no encontrado');
  errors++;
}

console.log('');

// Verificar Service Worker
console.log('⚙️  Verificando Service Worker...');
const swPath = path.join(rootDir, 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  console.log('  ✅ sw.js encontrado');
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Verificar que tiene los eventos básicos
  const requiredEvents = ['install', 'activate', 'fetch'];
  requiredEvents.forEach(event => {
    if (swContent.includes(`addEventListener('${event}'`)) {
      console.log(`  ✅ Evento ${event} configurado`);
    } else {
      console.error(`  ❌ Falta evento: ${event}`);
      errors++;
    }
  });
} else {
  console.error('  ❌ sw.js no encontrado');
  errors++;
}

console.log('');

// Verificar index.html
console.log('📝 Verificando index.html...');
const indexPath = path.join(rootDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Verificar link al manifest
  if (indexContent.includes('rel="manifest"')) {
    console.log('  ✅ Link a manifest.json presente');
  } else {
    console.error('  ❌ Falta link a manifest.json');
    errors++;
  }
  
  // Verificar meta tags de PWA
  const requiredMetas = [
    'mobile-web-app-capable',
    'apple-mobile-web-app-capable',
    'theme-color'
  ];
  
  requiredMetas.forEach(meta => {
    if (indexContent.includes(`name="${meta}"`)) {
      console.log(`  ✅ Meta tag ${meta} presente`);
    } else {
      console.warn(`  ⚠️  Meta tag ${meta} no encontrado`);
      warnings++;
    }
  });
} else {
  console.error('  ❌ index.html no encontrado');
  errors++;
}

console.log('');

// Verificar componentes PWA
console.log('⚛️  Verificando componentes React...');
const componentsToCheck = [
  'src/components/PWAInstallPrompt.tsx',
  'src/lib/pwaUtils.ts'
];

componentsToCheck.forEach(component => {
  const componentPath = path.join(rootDir, component);
  if (fs.existsSync(componentPath)) {
    console.log(`  ✅ ${component} encontrado`);
  } else {
    console.error(`  ❌ ${component} no encontrado`);
    errors++;
  }
});

console.log('');

// Verificar registro de Service Worker en main.tsx
console.log('🚀 Verificando registro de Service Worker...');
const mainPath = path.join(rootDir, 'src', 'main.tsx');
if (fs.existsSync(mainPath)) {
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  
  if (mainContent.includes('serviceWorker')) {
    console.log('  ✅ Service Worker registrado en main.tsx');
  } else {
    console.error('  ❌ Service Worker no registrado en main.tsx');
    errors++;
  }
  
  if (mainContent.includes('logPWAInfo')) {
    console.log('  ✅ PWA logging configurado');
  } else {
    console.warn('  ⚠️  PWA logging no configurado');
    warnings++;
  }
} else {
  console.error('  ❌ main.tsx no encontrado');
  errors++;
}

console.log('');

// Resumen
console.log('📊 Resumen:');
console.log(`  ✅ Verificaciones exitosas`);
console.log(`  ❌ Errores: ${errors}`);
console.log(`  ⚠️  Advertencias: ${warnings}`);
console.log('');

if (errors === 0 && warnings === 0) {
  console.log('🎉 ¡Configuración de PWA perfecta!');
  process.exit(0);
} else if (errors === 0) {
  console.log('✅ Configuración de PWA correcta (con advertencias menores)');
  process.exit(0);
} else {
  console.log('❌ Hay errores en la configuración de PWA que deben corregirse');
  process.exit(1);
}
