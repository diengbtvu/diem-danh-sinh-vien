#!/bin/bash

echo "🚀 Production Deployment Script"
echo "📍 Server: 14.225.220.60"
echo "🔧 Backend: :8081 | 🌐 Frontend: :8000 | 🤖 Face API: :5001"
echo ""

# Load environment variables
source production.env

# Make all scripts executable
chmod +x *.sh

echo "1️⃣ Stopping existing services..."
pkill -f "spring-boot:run" || true
pkill -f "java.*attendance-backend" || true
pkill -f "vite.*8000" || true
pkill -f "node.*vite" || true
sleep 3

echo ""
echo "2️⃣ Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "3️⃣ Starting Backend (Port 8081)..."
cd backend
nohup mvn spring-boot:run > ../backend.log 2>&1 &
cd ..

echo "Waiting for backend to start..."
sleep 15

# Check backend health
if curl -f http://14.225.220.60:8081/api/sessions/config > /dev/null 2>&1; then
    echo "✅ Backend started successfully"
else
    echo "❌ Backend failed to start"
    tail -10 backend.log
    exit 1
fi

echo ""
echo "4️⃣ Starting Frontend (Port 8000)..."
cd frontend
nohup npm run serve > ../frontend.log 2>&1 &
cd ..

echo "Waiting for frontend to start..."
sleep 10

# Check frontend health
if curl -f http://14.225.220.60:8000 > /dev/null 2>&1; then
    echo "✅ Frontend started successfully"
else
    echo "❌ Frontend failed to start"
    tail -10 frontend.log
    exit 1
fi

echo ""
echo "🎉 Production deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "   🏠 Admin Dashboard: http://14.225.220.60:8000/admin"
echo "   📱 Attendance: http://14.225.220.60:8000/attend"
echo "   🔧 Backend API: http://14.225.220.60:8081/api"
echo "   🤖 Face API: http://14.225.220.60:5001"
echo ""
echo "🔍 Health Checks:"
curl -s http://14.225.220.60:8081/api/sessions/config > /dev/null && echo "   ✅ Backend: Online" || echo "   ❌ Backend: Offline"
curl -s http://14.225.220.60:8000 > /dev/null && echo "   ✅ Frontend: Online" || echo "   ❌ Frontend: Offline"
echo ""
echo "📝 Monitor logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Stop services:"
echo "   pkill -f 'spring-boot:run' && pkill -f 'vite.*8000'"
