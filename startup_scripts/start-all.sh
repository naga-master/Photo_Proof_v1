#!/bin/bash

# Photo Proof - Start All Services
# This script starts both backend and frontend

echo "🚀 Starting Photo Proof Application"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get network IP
NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Check if backend directory exists
if [ ! -d "photo_proof_api" ]; then
    echo -e "${RED}❌ Error: photo_proof_api directory not found${NC}"
    echo "Please run this script from the v0_photo_proof directory"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "Photo_Proof_v1" ]; then
    echo -e "${RED}❌ Error: Photo_Proof_v1 directory not found${NC}"
    echo "Please run this script from the v0_photo_proof directory"
    exit 1
fi

echo -e "${YELLOW}📋 Network Information:${NC}"
echo "   Local IP:   localhost"
echo "   Network IP: $NETWORK_IP"
echo ""
echo -e "${YELLOW}📍 Access URLs (after startup):${NC}"
echo "   Desktop: http://localhost:3001"
echo "   Mobile:  http://$NETWORK_IP:3001"
echo ""
echo -e "${GREEN}Starting services...${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start backend in background
echo -e "${GREEN}🔧 Starting Backend API...${NC}"
cd photo_proof_api
python main.py &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo ""
echo -e "${GREEN}🎨 Starting Frontend...${NC}"
cd Photo_Proof_v1
npm run dev

# This line will be reached when frontend is stopped
wait
