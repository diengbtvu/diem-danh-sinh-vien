#!/bin/bash

echo "🚀 Deploying Full Attendance System..."
echo "📍 Server IP: 14.225.220.60"
echo "🔧 Backend Port: 8081"
echo "🌐 Frontend Port: 8000"
echo "🤖 Face API Port: 5001"
echo ""

# Make scripts executable
chmod +x deploy-backend.sh
chmod +x deploy-frontend.sh

# Deploy backend first
echo "1️⃣ Deploying Backend..."
./deploy-backend.sh

if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed. Stopping deployment."
    exit 1
fi

echo ""
echo "2️⃣ Deploying Frontend..."
./deploy-frontend.sh

if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed. Backend is still running."
    exit 1
fi

echo ""
echo "🎉 Full deployment completed successfully!"
echo ""
echo "📋 System URLs:"
echo "   🏠 Admin Dashboard: http://14.225.220.60:8000/admin"
echo "   📱 Attendance Page: http://14.225.220.60:8000/attend"
echo "   🔧 Backend API: http://14.225.220.60:8081/api"
echo "   🤖 Face API: http://14.225.220.60:5001"
echo ""
echo "📊 Health Checks:"
echo "   Backend Config: http://14.225.220.60:8081/api/sessions/config"
echo "   Frontend: http://14.225.220.60:8000"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Stop Services:"
echo "   pkill -f 'spring-boot:run'"
echo "   pkill -f 'vite.*8000'"
