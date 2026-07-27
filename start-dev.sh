#!/bin/bash

# Script para levantar el proyecto en desarrollo con puertos fijos
# Backend: puerto 3000
# Frontend: puerto 5173

set -e

echo "🧹 Limpiando procesos anteriores..."
lsof -ti:3000,5173 | xargs kill -9 2>/dev/null || true
sleep 2

echo ""
echo "🚀 Iniciando Bible Concordance..."
echo ""

# Levantar backend
echo "📦 Backend: iniciando en puerto 3000..."
cd /workspaces/bible-concordance/backend
npm run build > /dev/null 2>&1
npm start &
BACKEND_PID=$!

# Esperar a que el backend esté listo
sleep 3

# Levantar frontend  
echo "🎨 Frontend: iniciando en puerto 5173..."
cd /workspaces/bible-concordance/frontend
npm run dev &
FRONTEND_PID=$!

# Mensajes de confirmación
echo ""
echo "✅ Proyecto levantado exitosamente!"
echo ""
echo "🔗 URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3000"
echo "   API:       http://localhost:3000/api"
echo ""
echo "📝 Procesos:"
echo "   Backend (PID: $BACKEND_PID)"
echo "   Frontend (PID: $FRONTEND_PID)"
echo ""
echo "⏹️  Para detener: Ctrl+C"
echo ""

# Mantener vivo el script
wait
