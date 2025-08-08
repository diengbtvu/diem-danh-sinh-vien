#!/bin/bash

echo "🚀 Deploying Attendance System for zettix.net"
echo "🔧 Backend: localhost:8082"
echo "🌐 Frontend: https://zettix.net (via Nginx)"
echo ""

# Stop existing backend
echo "1️⃣ Stopping existing backend..."
pkill -f "spring-boot:run" || true
pkill -f "java.*attendance-backend" || true
sleep 3

# Start backend
echo "2️⃣ Starting backend on port 8082..."
cd backend
nohup mvn spring-boot:run > ../backend.log 2>&1 &
cd ..

echo "Waiting for backend to start..."
sleep 15

# Check backend health
if curl -f http://localhost:8082/api/sessions/config > /dev/null 2>&1; then
    echo "✅ Backend started successfully"
else
    echo "❌ Backend failed to start"
    tail -10 backend.log
    exit 1
fi

echo ""
echo "3️⃣ Building frontend..."
cd frontend
npm install
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build completed"
cd ..

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Services:"
echo "   🔧 Backend: http://localhost:8082"
echo "   📁 Frontend build: frontend/dist/"
echo ""
echo "🌍 Public URLs:"
echo "   🏠 Admin Dashboard: https://zettix.net/admin"
echo "   📱 Attendance: https://zettix.net/attend"
echo "   🔧 Backend API: https://zettix.net/api"
echo ""
echo "🔍 Health Check:"
curl -s http://localhost:8082/api/sessions/config > /dev/null && echo "   ✅ Backend: Online" || echo "   ❌ Backend: Offline"
echo ""
echo "📝 Monitor backend:"
echo "   tail -f backend.log"
echo ""
echo "📋 Next steps:"
echo "   1. Copy frontend/dist/* to your web server directory"
echo "   2. Make sure Nginx proxies /api/ to http://localhost:8082"
echo "   3. Test: curl https://zettix.net/api/sessions/config"
