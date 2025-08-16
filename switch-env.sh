#!/bin/bash

if [ "$1" = "local" ]; then
    echo "🔧 Configurando para DESARROLLO LOCAL..."
    
    # Frontend
    sed -i '' "s|baseURL: '/api'|baseURL: 'http://localhost:3000/api'|" js/api.js
    echo "  ✓ Frontend: localhost:3000"
    
    # Backend
    if [ -f backend/.env.local ]; then
        cp backend/.env.local backend/.env
        echo "  ✓ Backend: .env.local"
    fi
    
    echo "✅ Modo LOCAL activado"
    
elif [ "$1" = "prod" ]; then
    echo "🚀 Configurando para PRODUCCIÓN..."
    
    # Frontend
    sed -i '' "s|baseURL: 'http://localhost:3000/api'|baseURL: '/api'|" js/api.js
    echo "  ✓ Frontend: /api"
    
    # Backend
    if [ -f backend/.env.production ]; then
        cp backend/.env.production backend/.env
        echo "  ✓ Backend: .env.production"
    fi
    
    echo "✅ Modo PRODUCCIÓN activado"
    echo "⚠️  Revisa antes de hacer push!"
    
else
    echo "Estado actual:"
    echo -n "  Frontend: "
    grep "baseURL:" js/api.js | head -1 | cut -d"'" -f2
    echo -n "  Backend: "
    grep "NODE_ENV" backend/.env | cut -d"=" -f2
    echo ""
    echo "Uso: ./switch-env.sh [local|prod]"
fi
