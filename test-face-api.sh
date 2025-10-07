#!/bin/bash

# Test script for Face API integration
# Usage: ./test-face-api.sh

echo "========================================="
echo "Face API Integration Test"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Face API health
echo "1. Checking Face API health..."
HEALTH=$(curl -s "https://server.zettix.net/api/v1/face-recognition/health")
echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"

if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Face API is healthy${NC}"
else
    echo -e "${RED}✗ Face API is not healthy${NC}"
    exit 1
fi
echo ""

# 2. Check backend service
echo "2. Checking backend service..."
if systemctl is-active --quiet diemdanh-backend.service; then
    echo -e "${GREEN}✓ Backend service is running${NC}"
else
    echo -e "${RED}✗ Backend service is not running${NC}"
    exit 1
fi
echo ""

# 3. Show recent attendance records
echo "3. Recent attendance records (last 3):"
mysql -u root -p'2A054C17@aA@2A054C17**' -D attendance -e "
SELECT 
    id,
    mssv,
    SUBSTRING(face_label, 1, 30) as face_label,
    ROUND(face_confidence * 100, 2) as 'conf_%',
    status,
    DATE_FORMAT(created_at, '%H:%i:%s %d/%m/%Y') as created
FROM attendances 
ORDER BY created_at DESC 
LIMIT 3;
" 2>/dev/null

echo ""

# 4. Monitor logs instruction
echo "4. To monitor Face API calls in realtime:"
echo -e "${YELLOW}   journalctl -u diemdanh-backend.service -f | grep -i 'face'${NC}"
echo ""

# 5. Test submission instruction
echo "5. To test attendance submission:"
echo "   a. Open: https://diemdanh.zettix.net"
echo "   b. Scan QR code from a session"
echo "   c. Take a photo and submit"
echo "   d. Watch logs with command from step 4"
echo ""

# 6. Expected logs
echo "6. Expected logs after submission:"
echo -e "${GREEN}   Face API request: imageSize=XXX bytes, filename=YYY${NC}"
echo -e "${GREEN}   Sending Face API request to: ...${NC}"
echo -e "${GREEN}   Face API raw response: success=true, totalFaces=1${NC}"
echo -e "${GREEN}   Face API: Detected - class=110122074_Name, confidence=0.95${NC}"
echo -e "${GREEN}   Face API call succeeded - response received${NC}"
echo ""

echo "========================================="
echo "Test completed!"
echo "========================================="