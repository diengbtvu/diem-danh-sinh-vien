#!/bin/bash

echo "🚀 Deploying Backend to port 8081..."

# Kill existing backend process
echo "Stopping existing backend..."
pkill -f "spring-boot:run" || true
pkill -f "java.*attendance-backend" || true

# Wait a moment for processes to stop
sleep 2

# Navigate to backend directory
cd backend

# Build and run backend
echo "Starting backend on port 8081..."
nohup mvn spring-boot:run > ../backend.log 2>&1 &

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 10

# Check if backend is running
if curl -f http://14.225.220.60:8081/api/sessions/config > /dev/null 2>&1; then
    echo "✅ Backend started successfully on http://14.225.220.60:8081"
    echo "📋 Config endpoint: http://14.225.220.60:8081/api/sessions/config"
    echo "📊 Admin API: http://14.225.220.60:8081/api/admin"
    echo "📱 Attendance API: http://14.225.220.60:8081/api/attendances"
else
    echo "❌ Backend failed to start. Check backend.log for details."
    tail -20 ../backend.log
    exit 1
fi

echo "🎉 Backend deployment completed!"
