#!/bin/bash

# =====================================================
# Script de Verificación de Cron Jobs
# =====================================================
# Este script ejecuta el archivo SQL de verificación
# =====================================================

echo "=================================================="
echo "Verificación de Cron Jobs - Sistema de Lista de Espera"
echo "=================================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "supabase/config.toml" ]; then
  echo "❌ Error: Debes ejecutar este script desde la raíz del proyecto"
  exit 1
fi

echo "Ejecutando verificaciones..."
echo ""

# Nota: El comando supabase db remote psql no soporta bien heredoc
# Por lo tanto, este script es solo informativo

echo "Para ejecutar las verificaciones completas, usa uno de estos métodos:"
echo ""
echo "1. Desde Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/sql/new"
echo "   Copia y pega el contenido de: scripts/test-cron-jobs.sql"
echo ""
echo "2. Verificaciones rápidas con MCP:"
echo "   - Tabla de logs: mcp_supabase_reserveo_supabase_describe_table('waitlist_cron_logs')"
echo "   - Contar logs: mcp_supabase_reserveo_supabase_count_records('waitlist_cron_logs')"
echo ""
echo "3. Verificaciones manuales:"
echo "   - Ver cron jobs: SELECT * FROM cron.job WHERE jobname LIKE '%waitlist%';"
echo "   - Ver logs: SELECT * FROM waitlist_cron_logs ORDER BY created_at DESC LIMIT 10;"
echo ""
echo "Para más información, consulta:"
echo "  scripts/VERIFY-CRON-JOBS.md"
echo ""
echo "=================================================="
