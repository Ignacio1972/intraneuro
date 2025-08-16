#!/bin/bash

# Script para sincronizar pacientes desde producción a local
# INTRANEURO - Sistema de Gestión Clínica

echo "╔════════════════════════════════════════╗"
echo "║  SINCRONIZACIÓN DE DATOS DE PRODUCCIÓN  ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Variables
VPS_HOST="148.113.205.115"
VPS_USER="root"
VPS_PASS="39933993"
REMOTE_DB="intraneuro_db"
REMOTE_USER="intraneuro_user"
LOCAL_DB="intraneuro_dev"
LOCAL_USER="dev_user"
LOCAL_PASS="desarrollo2025"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="intraneuro_backup_${TIMESTAMP}.sql"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  ADVERTENCIA: Esto sobrescribirá los datos locales${NC}"
echo -e "¿Deseas continuar? (s/n): "
read -r respuesta

if [[ ! "$respuesta" =~ ^[Ss]$ ]]; then
    echo -e "${RED}Operación cancelada${NC}"
    exit 1
fi

# Verificar si sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Instalando sshpass...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass 2>/dev/null || {
            echo -e "${RED}Error: No se pudo instalar sshpass. Instálalo manualmente con: brew install hudochenkov/sshpass/sshpass${NC}"
            exit 1
        }
    else
        sudo apt-get install sshpass -y 2>/dev/null || {
            echo -e "${RED}Error: No se pudo instalar sshpass${NC}"
            exit 1
        }
    fi
fi

echo -e "\n${GREEN}1. Conectando al VPS de producción...${NC}"

# Crear backup en el servidor remoto (solo las tablas de datos, no usuarios)
echo -e "${GREEN}2. Creando backup de la base de datos de producción...${NC}"
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "
    # Obtener la contraseña de la base de datos del archivo .env
    DB_PASS=\$(grep '^DB_PASS=' /var/www/intraneuro/backend/.env | cut -d '=' -f2)
    
    # Crear backup usando la contraseña
    PGPASSWORD=\$DB_PASS pg_dump -h localhost -U $REMOTE_USER -d $REMOTE_DB \
        --no-owner \
        --no-acl \
        --data-only \
        --table=patients \
        --table=admissions \
        --table=observations \
        --table=pending_tasks \
        --table=timeline_events \
        > /tmp/$BACKUP_FILE 2>/dev/null
    
    if [ \$? -eq 0 ]; then
        echo 'Backup creado exitosamente'
    else
        echo 'Error al crear backup'
        exit 1
    fi
"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error al crear backup en el servidor${NC}"
    exit 1
fi

echo -e "${GREEN}3. Descargando backup a local...${NC}"
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST:/tmp/$BACKUP_FILE /tmp/$BACKUP_FILE

if [ $? -ne 0 ]; then
    echo -e "${RED}Error al descargar el backup${NC}"
    exit 1
fi

# Limpiar archivo temporal en el servidor
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "rm /tmp/$BACKUP_FILE"

echo -e "${GREEN}4. Preparando base de datos local...${NC}"

# Limpiar tablas locales (manteniendo estructura y usuarios)
PGPASSWORD=$LOCAL_PASS psql -U $LOCAL_USER -d $LOCAL_DB <<EOF
-- Desactivar restricciones temporalmente
SET session_replication_role = 'replica';

-- Limpiar tablas en orden correcto (por las foreign keys)
TRUNCATE TABLE timeline_events CASCADE;
TRUNCATE TABLE pending_tasks CASCADE;
TRUNCATE TABLE observations CASCADE;
TRUNCATE TABLE admissions CASCADE;
TRUNCATE TABLE patients CASCADE;

-- Reactivar restricciones
SET session_replication_role = 'origin';
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}Error al limpiar base de datos local${NC}"
    exit 1
fi

echo -e "${GREEN}5. Importando datos en base de datos local...${NC}"
PGPASSWORD=$LOCAL_PASS psql -U $LOCAL_USER -d $LOCAL_DB < /tmp/$BACKUP_FILE

if [ $? -ne 0 ]; then
    echo -e "${RED}Error al importar datos${NC}"
    exit 1
fi

# Verificar la importación
echo -e "\n${GREEN}6. Verificando importación...${NC}"
PATIENT_COUNT=$(PGPASSWORD=$LOCAL_PASS psql -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM patients;")
ADMISSION_COUNT=$(PGPASSWORD=$LOCAL_PASS psql -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM admissions;")
ACTIVE_COUNT=$(PGPASSWORD=$LOCAL_PASS psql -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM admissions WHERE status='active';")

echo -e "${GREEN}✅ Importación completada exitosamente${NC}"
echo ""
echo "📊 Resumen de datos importados:"
echo "   • Pacientes totales: $PATIENT_COUNT"
echo "   • Admisiones totales: $ADMISSION_COUNT"
echo "   • Pacientes activos: $ACTIVE_COUNT"
echo ""

# Limpiar archivo temporal local
rm /tmp/$BACKUP_FILE

echo -e "${GREEN}✨ Sincronización completada${NC}"
echo "Puedes acceder a los datos en: http://localhost:8080"
echo "Usuario: doctor1 / Password: doctor123"