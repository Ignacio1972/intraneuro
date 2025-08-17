#!/bin/bash
# Switch Environment v2 - Soporte robusto para local/prod/mobile

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[OK] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Detectar configuracion actual
detect_current_config() {
    local api_url=$(grep "baseURL:" js/api.js | head -1 | sed "s/.*baseURL: *['\"]\\([^'\"]*\\)['\"].*/\\1/")
    local backend_env="unknown"
    
    if [[ -f "backend/.env" ]]; then
        backend_env=$(grep "NODE_ENV" backend/.env 2>/dev/null | cut -d"=" -f2 || echo "unknown")
    fi
    
    echo "API: $api_url"
    echo "Backend: $backend_env"
    
    # Determinar modo actual
    if [[ "$api_url" == "/api" ]]; then
        echo "MODO: produccion"
    elif [[ "$api_url" == "http://localhost:3000/api" ]]; then
        echo "MODO: local"
    elif [[ "$api_url" =~ ^http://192\.168\.[0-9]+\.[0-9]+:3000/api$ ]]; then
        echo "MODO: movil"
    else
        echo "MODO: desconocido"
    fi
}

# Crear backup con timestamp
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    if [[ -f "js/api.js" ]]; then
        cp "js/api.js" "js/api.js.backup_${timestamp}"
        log_info "Backup: js/api.js.backup_${timestamp}"
    fi
    
    if [[ -f "backend/.env" ]]; then
        cp "backend/.env" "backend/.env.backup_${timestamp}"
        log_info "Backup: backend/.env.backup_${timestamp}"
    fi
}

# Configurar para LOCAL
setup_local() {
    log_info "Configurando para DESARROLLO LOCAL..."
    
    # Frontend - usar regex robusto para cualquier configuracion previa
    if [[ -f "js/api.js" ]]; then
        # Cambiar cualquier baseURL a localhost
        sed -i '' -E "s|baseURL: *['\"][^'\"]*['\"]|baseURL: 'http://localhost:3000/api'|" js/api.js
        log_success "Frontend: http://localhost:3000/api"
    else
        log_error "No se encontro js/api.js"
        return 1
    fi
    
    # Backend
    if [[ -f "backend/.env.local" ]]; then
        cp "backend/.env.local" "backend/.env"
        log_success "Backend: .env.local copiado"
    else
        log_warning "No se encontro backend/.env.local"
    fi
    
    log_success "Modo LOCAL activado"
}

# Configurar para PRODUCCION
setup_prod() {
    log_info "Configurando para PRODUCCION..."
    
    # Frontend
    if [[ -f "js/api.js" ]]; then
        # Cambiar cualquier baseURL a /api
        sed -i '' -E "s|baseURL: *['\"][^'\"]*['\"]|baseURL: '/api'|" js/api.js
        log_success "Frontend: /api"
    else
        log_error "No se encontro js/api.js"
        return 1
    fi
    
    # Backend
    if [[ -f "backend/.env.production" ]]; then
        cp "backend/.env.production" "backend/.env"
        log_success "Backend: .env.production copiado"
    else
        log_warning "No se encontro backend/.env.production"
    fi
    
    log_success "Modo PRODUCCION activado"
    log_warning "Revisa configuracion antes de hacer push!"
}

# Configurar para MOVIL
setup_mobile() {
    log_info "Configurando para DESARROLLO MOVIL..."
    
    # Detectar IP automaticamente
    local ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | grep -v "inet 169.254" | awk '{print $2}' | head -1)
    
    if [[ -z "$ip" ]]; then
        log_error "No se pudo detectar IP automaticamente"
        read -p "Ingresa tu IP local: " ip
    fi
    
    log_info "IP detectada: $ip"
    
    # Frontend
    if [[ -f "js/api.js" ]]; then
        # Cambiar cualquier baseURL a la IP movil
        sed -i '' -E "s|baseURL: *['\"][^'\"]*['\"]|baseURL: 'http://$ip:3000/api'|" js/api.js
        log_success "Frontend: http://$ip:3000/api"
    else
        log_error "No se encontro js/api.js"
        return 1
    fi
    
    # Backend
    if [[ -f "backend/.env.mobile" ]]; then
        cp "backend/.env.mobile" "backend/.env"
        log_success "Backend: .env.mobile copiado"
    else
        log_warning "No se encontro backend/.env.mobile, usando configuracion actual"
    fi
    
    log_success "Modo MOVIL activado"
    log_info "Acceso movil: http://$ip:8080"
}

# Mostrar estado actual
show_status() {
    echo ""
    log_info "Estado actual de configuracion:"
    echo ""
    detect_current_config
    echo ""
    
    # Verificar integridad
    if [[ -f "js/api.js" && -f "backend/.env" ]]; then
        log_success "Archivos de configuracion encontrados"
    else
        log_error "Faltan archivos de configuracion"
    fi
}

# Funcion principal
main() {
    local mode="$1"
    
    # Verificar directorio
    if [[ ! -f "js/api.js" ]] || [[ ! -d "backend" ]]; then
        log_error "Ejecuta este script desde el directorio raiz del proyecto"
        exit 1
    fi
    
    case "$mode" in
        "local")
            create_backup
            setup_local
            ;;
        "prod")
            create_backup
            setup_prod
            ;;
        "mobile")
            create_backup
            setup_mobile
            ;;
        "status")
            show_status
            ;;
        *)
            echo ""
            log_info "Switch Environment v2 - Gestion robusta de ambientes"
            echo ""
            show_status
            echo ""
            echo -e "${YELLOW}Uso:${NC}"
            echo "  ./switch-env-v2-clean.sh local   - Desarrollo local"
            echo "  ./switch-env-v2-clean.sh prod    - Produccion"
            echo "  ./switch-env-v2-clean.sh mobile  - Desarrollo movil"
            echo "  ./switch-env-v2-clean.sh status  - Ver estado actual"
            echo ""
            ;;
    esac
}

# Ejecutar
main "$@"