#!/bin/bash

# Script para marcar todas las migraciones locales como aplicadas en remoto
# Usar SOLO si las migraciones ya están aplicadas manualmente

echo "🔍 Marcando migraciones como aplicadas en remoto..."
echo ""

# Array de timestamps de migraciones
migrations=(
  "20251105193026"
  "20251109172649"
  "20251109173431"
  "20251109181717"
  "20251109181920"
  "20251109182850"
  "20251109183936"
  "20251110151601"
  "20251110154528"
  "20251110154538"
  "20251110155131"
  "20251110193022"
  "20251110204038"
  "20251110205231"
  "20251110211533"
  "20251110212223"
  "20251110214736"
  "20251110215124"
  "20251111234017"
  "20251112000130"
  "20251112105802"
  "20251112212041"
  "20251112213615"
  "20251112220218"
  "20251112222400"
  "20251112223609"
)

# Marcar cada migración como aplicada
for migration in "${migrations[@]}"; do
  echo "✅ Marcando $migration como aplicada..."
  supabase migration repair --status applied "$migration"
done

echo ""
echo "✨ Proceso completado. Verifica con: supabase migration list"
