#!/usr/bin/env bash
# ==============================================================================
# ⚡ GYMHQ Launcher Script
# Starts both the FastAPI Backend and Vite Frontend development servers.
# Press Ctrl+C at any time to stop both servers.
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "⚡ Launching GYMHQ from: ${PROJECT_DIR}"

# Cleanup function to kill background processes on exit
cleanup() {
  echo ""
  echo "🛑 Stopping GYMHQ servers..."
  kill $(jobs -p) 2>/dev/null || true
  if [ -n "${BACKEND_PID:-}" ]; then kill -9 "$BACKEND_PID" 2>/dev/null || true; fi
  if [ -n "${FRONTEND_PID:-}" ]; then kill -9 "$FRONTEND_PID" 2>/dev/null || true; fi
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Free ports 8000 and 5173 if lingering from a previous session
if lsof -ti :8000 >/dev/null 2>&1; then
  echo "🧹 Freeing port 8000 from previous session..."
  kill -9 $(lsof -ti :8000) 2>/dev/null || true
  sleep 1
fi

if lsof -ti :5173 >/dev/null 2>&1; then
  echo "🧹 Freeing port 5173 from previous session..."
  kill -9 $(lsof -ti :5173) 2>/dev/null || true
  sleep 1
fi

# 1. Start FastAPI Backend
echo "🚀 [1/2] Starting Backend API on http://127.0.0.1:8000 (Swagger docs: http://127.0.0.1:8000/docs)..."
cd "${PROJECT_DIR}/backend"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait 2 seconds for backend to initialize
sleep 2

# 2. Start Vite Frontend
echo "🌐 [2/2] Starting Frontend App on http://localhost:5173..."
cd "${PROJECT_DIR}/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "⚡ GYMHQ is now running!"
echo "👉 Web App:        http://localhost:5173"
echo "👉 Backend API:    http://127.0.0.1:8000"
echo "👉 API Docs:       http://127.0.0.1:8000/docs"
echo "👉 Login:          admin / adminpassword123"
echo "=========================================================="
echo "Press Ctrl+C to stop both servers."
echo ""

# Keep script running and wait for background jobs
wait
