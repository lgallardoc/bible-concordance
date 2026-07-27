#!/bin/bash

# Script para detener todos los procesos del proyecto

echo "🛑 Deteniendo procesos..."

lsof -ti:3000,5173 | xargs kill -9 2>/dev/null || true
pkill -f "npm start" || true
pkill -f "npm run dev" || true
pkill -f "node dist" || true

sleep 1

echo "✅ Procesos detenidos"
echo ""
echo "Verificando puertos disponibles:"
lsof -i :3000,:5173 2>/dev/null || echo "✓ Puertos 3000 y 5173 están libres"
