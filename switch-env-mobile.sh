#!/bin/bash

# Detectar IP automáticamente
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
else
    # Linux
    IP=$(hostname -I | awk '{print $1}')
fi

echo "📱 Configurando para pruebas móviles..."
echo "   IP detectada: $IP"

# Configurar Frontend
sed -i.bak "s|baseURL: '.*'|baseURL: 'http://$IP:3000/api'|" js/api.js

# Configurar Backend CORS
sed -i.bak "s|FRONTEND_URL=.*|FRONTEND_URL=*|" backend/.env

echo ""
echo "✅ Listo! Accede desde tu móvil a:"
echo "   http://$IP:8080"
echo ""
echo "⚠️  Para volver a local usa: ./switch-env.sh local"