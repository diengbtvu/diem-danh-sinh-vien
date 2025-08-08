#!/bin/bash

echo "🚀 Deploying Frontend to port 8000..."

# Kill existing frontend process
echo "Stopping existing frontend..."
pkill -f "vite.*8000" || true
pkill -f "node.*vite" || true

# Wait a moment for processes to stop
sleep 2

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build for production (optional)
echo "Building frontend..."
npm run build

# Start frontend development server
echo "Starting frontend on port 8000..."
nohup npm run dev > ../frontend.log 2>&1 &

# Wait for frontend to start
echo "Waiting for frontend to start..."
sleep 10

# Check if frontend is running
if curl -f http://14.225.220.60:8000 > /dev/null 2>&1; then
    echo "✅ Frontend started successfully on http://14.225.220.60:8000"
    echo "🏠 Admin Dashboard: http://14.225.220.60:8000/admin"
    echo "📱 Attendance Page: http://14.225.220.60:8000/attend"
    echo "➕ Create Session: http://14.225.220.60:8000/admin (tab Tạo buổi học)"
else
    echo "❌ Frontend failed to start. Check frontend.log for details."
    tail -20 ../frontend.log
    exit 1
fi

echo "🎉 Frontend deployment completed!"
