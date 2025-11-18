#!/bin/bash

# Network Access Test Script
# Tests if Photo Proof app is accessible from network

echo "🔍 Photo Proof Network Access Test"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get network IP
NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

echo -e "${BLUE}1. Network Information${NC}"
echo "   Your IP: $NETWORK_IP"
echo ""

# Check if services are running
echo -e "${BLUE}2. Services Status${NC}"

FRONTEND_RUNNING=$(lsof -i :3001 2>/dev/null | grep LISTEN)
BACKEND_RUNNING=$(lsof -i :8000 2>/dev/null | grep LISTEN)

if [ -n "$FRONTEND_RUNNING" ]; then
    echo -e "   Frontend (3001): ${GREEN}✓ Running${NC}"
else
    echo -e "   Frontend (3001): ${RED}✗ Not Running${NC}"
    echo -e "   ${YELLOW}Start with: cd Photo_Proof_v1 && npm run dev${NC}"
fi

if [ -n "$BACKEND_RUNNING" ]; then
    echo -e "   Backend (8000):  ${GREEN}✓ Running${NC}"
else
    echo -e "   Backend (8000):  ${RED}✗ Not Running${NC}"
    echo -e "   ${YELLOW}Start with: cd photo_proof_api && python main.py${NC}"
fi

echo ""

# Test localhost access
echo -e "${BLUE}3. Local Access Test${NC}"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|301\|302"; then
    echo -e "   Localhost:3001:  ${GREEN}✓ Accessible${NC}"
else
    echo -e "   Localhost:3001:  ${YELLOW}⚠ Check service${NC}"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health 2>/dev/null | grep -q "200"; then
    echo -e "   Localhost:8000:  ${GREEN}✓ Accessible${NC}"
else
    echo -e "   Localhost:8000:  ${YELLOW}⚠ Check service${NC}"
fi

echo ""

# Test network access
echo -e "${BLUE}4. Network Access Test${NC}"

NETWORK_FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$NETWORK_IP:3001 2>/dev/null || echo "000")
NETWORK_BACKEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$NETWORK_IP:8000/api/health 2>/dev/null || echo "000")

if [ "$NETWORK_FRONTEND_CODE" = "200" ] || [ "$NETWORK_FRONTEND_CODE" = "301" ] || [ "$NETWORK_FRONTEND_CODE" = "302" ]; then
    echo -e "   Network:3001:    ${GREEN}✓ Accessible (code: $NETWORK_FRONTEND_CODE)${NC}"
    echo -e "   ${GREEN}Mobile should work!${NC}"
else
    echo -e "   Network:3001:    ${RED}✗ Blocked (code: $NETWORK_FRONTEND_CODE)${NC}"
    echo -e "   ${YELLOW}Likely firewall issue${NC}"
fi

if [ "$NETWORK_BACKEND_CODE" = "200" ]; then
    echo -e "   Network:8000:    ${GREEN}✓ Accessible${NC}"
else
    echo -e "   Network:8000:    ${RED}✗ Blocked (code: $NETWORK_BACKEND_CODE)${NC}"
    echo -e "   ${YELLOW}Likely firewall issue${NC}"
fi

echo ""

# Check firewall status
echo -e "${BLUE}5. Firewall Status${NC}"
FIREWALL_STATUS=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null)

if echo "$FIREWALL_STATUS" | grep -q "enabled"; then
    echo -e "   Firewall: ${YELLOW}⚠ Enabled${NC}"
    echo -e "   ${YELLOW}This is likely blocking mobile access${NC}"
    echo ""
    echo -e "   ${BLUE}To fix:${NC}"
    echo "   1. Open System Settings → Network → Firewall"
    echo "   2. Click 'Options' and add:"
    echo "      - /usr/local/bin/node (Allow)"
    echo "      - /usr/local/bin/python3 (Allow)"
    echo "   3. Or temporarily disable: sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off"
    echo ""
    echo -e "   ${RED}See MOBILE_ACCESS_SETUP.md for detailed instructions${NC}"
else
    echo -e "   Firewall: ${GREEN}✓ Disabled or allowing connections${NC}"
fi

echo ""
echo "====================================="
echo -e "${BLUE}Mobile Access URL:${NC}"
echo "   http://$NETWORK_IP:3001"
echo ""

if [ -n "$FRONTEND_RUNNING" ] && [ -n "$BACKEND_RUNNING" ] && ([ "$NETWORK_FRONTEND_CODE" = "200" ] || [ "$NETWORK_FRONTEND_CODE" = "301" ]); then
    echo -e "${GREEN}✓ Everything looks good! Try accessing from mobile.${NC}"
elif [ -z "$FRONTEND_RUNNING" ] || [ -z "$BACKEND_RUNNING" ]; then
    echo -e "${RED}✗ Services not running. Start them first.${NC}"
elif echo "$FIREWALL_STATUS" | grep -q "enabled"; then
    echo -e "${YELLOW}⚠ Firewall is blocking access. Configure firewall to allow Node and Python.${NC}"
else
    echo -e "${YELLOW}⚠ Check router settings for AP Isolation or Client Isolation.${NC}"
fi

echo ""
