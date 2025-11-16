#!/bin/bash

# Script para ejecutar tests de K6 fácilmente
# Uso: ./scripts/run-k6-tests.sh [smoke|load|stress|spike|all]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que K6 está instalado
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ K6 no está instalado${NC}"
    echo -e "${YELLOW}Instala K6 con: brew install k6${NC}"
    exit 1
fi

# Verificar que existe .env.k6
if [ ! -f .env.k6 ]; then
    echo -e "${RED}❌ Archivo .env.k6 no encontrado${NC}"
    echo -e "${YELLOW}Copia .env.k6.example a .env.k6 y configura tus variables${NC}"
    exit 1
fi

# Cargar variables de entorno
export $(cat .env.k6 | xargs)

# Verificar que SUPABASE_ANON_KEY está configurada
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_ANON_KEY no está configurada en .env.k6${NC}"
    exit 1
fi

# Función para ejecutar un test
run_test() {
    local test_name=$1
    local test_file="tests/k6/${test_name}-test.js"
    
    if [ ! -f "$test_file" ]; then
        echo -e "${RED}❌ Test no encontrado: $test_file${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🚀 Ejecutando ${test_name} test...${NC}"
    echo -e "${YELLOW}Archivo: $test_file${NC}"
    echo ""
    
    k6 run "$test_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${test_name} test completado${NC}"
    else
        echo -e "${RED}❌ ${test_name} test falló${NC}"
        return 1
    fi
    
    echo ""
    echo "-----------------------------------"
    echo ""
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: ./scripts/run-k6-tests.sh [test_type]"
    echo ""
    echo "Tipos de test disponibles:"
    echo "  smoke          - Prueba rápida (1 min, 2 VUs)"
    echo "  load           - Carga normal (10 min, 50-100 VUs)"
    echo "  stress         - Carga extrema (25 min, 100-400 VUs)"
    echo "  spike          - Picos súbitos (10 min, 50-500 VUs)"
    echo "  checkin        - Check-in/Check-out (15 min, 200 VUs)"
    echo "  waitlist       - Lista de espera (10 min, 50 VUs)"
    echo "  checkin-stats  - Estadísticas check-in (5 min, 20 VUs)"
    echo "  all            - Ejecutar todos los tests en secuencia"
    echo ""
    echo "Ejemplos:"
    echo "  ./scripts/run-k6-tests.sh smoke"
    echo "  ./scripts/run-k6-tests.sh checkin"
    echo "  ./scripts/run-k6-tests.sh all"
}

# Main
case "$1" in
    smoke)
        run_test "smoke"
        ;;
    load)
        run_test "load"
        ;;
    stress)
        run_test "stress"
        ;;
    spike)
        run_test "spike"
        ;;
    checkin)
        run_test "checkin"
        ;;
    waitlist)
        run_test "waitlist"
        ;;
    checkin-stats)
        run_test "checkin-stats"
        ;;
    all)
        echo -e "${BLUE}🚀 Ejecutando todos los tests...${NC}"
        echo ""
        run_test "smoke" && \
        run_test "load" && \
        run_test "checkin" && \
        run_test "waitlist" && \
        run_test "checkin-stats" && \
        run_test "stress" && \
        run_test "spike"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Todos los tests completados exitosamente${NC}"
        else
            echo -e "${RED}❌ Algunos tests fallaron${NC}"
            exit 1
        fi
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Tipo de test inválido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
