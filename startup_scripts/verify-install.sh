#!/bin/bash

# Verify Installation Script
# Checks if all dependencies are properly installed

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Photo Proof - Installation Verification${NC}"
echo "==========================================="
echo ""

ERRORS=0
WARNINGS=0

# Check Python
echo -e "${BLUE}Checking Python...${NC}"
if command -v python3 >/dev/null 2>&1; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python installed: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python 3 not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
echo -e "${BLUE}Checking npm...${NC}"
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check Backend
echo -e "${BLUE}Checking Backend...${NC}"
if [ -d "photo_proof_api/.venv" ]; then
    echo -e "${GREEN}✓ Python virtual environment exists${NC}"
    
    # Check if requirements are installed
    if [ -f "photo_proof_api/.venv/bin/python" ]; then
        cd photo_proof_api
        source .venv/bin/activate
        if python -c "import fastapi" 2>/dev/null; then
            echo -e "${GREEN}✓ FastAPI installed${NC}"
        else
            echo -e "${RED}✗ FastAPI not installed${NC}"
            ERRORS=$((ERRORS + 1))
        fi
        deactivate
        cd ..
    fi
else
    echo -e "${RED}✗ Python virtual environment not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "photo_proof_api/.env" ]; then
    echo -e "${GREEN}✓ Backend .env file exists${NC}"
else
    echo -e "${YELLOW}⚠ Backend .env file missing${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check Frontend
echo -e "${BLUE}Checking Frontend...${NC}"
if [ -d "Photo_Proof_v1/node_modules" ]; then
    echo -e "${GREEN}✓ Node modules installed${NC}"
    
    cd Photo_Proof_v1
    
    # Check Tailwind CSS v4
    if npm list @tailwindcss/postcss >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Tailwind CSS v4 installed${NC}"
    else
        echo -e "${RED}✗ Tailwind CSS v4 (@tailwindcss/postcss) missing${NC}"
        echo -e "${YELLOW}  Run: cd Photo_Proof_v1 && npm install -D @tailwindcss/postcss tailwindcss postcss autoprefixer${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check other key packages
    if npm list react >/dev/null 2>&1; then
        echo -e "${GREEN}✓ React installed${NC}"
    else
        echo -e "${RED}✗ React missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if npm list vite >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Vite installed${NC}"
    else
        echo -e "${RED}✗ Vite missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    cd ..
else
    echo -e "${RED}✗ Node modules not found${NC}"
    echo -e "${YELLOW}  Run: cd Photo_Proof_v1 && npm install${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "Photo_Proof_v1/.env.local" ]; then
    echo -e "${GREEN}✓ Frontend .env.local exists${NC}"
else
    echo -e "${YELLOW}⚠ Frontend .env.local missing${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "==========================================="
echo -e "${BLUE}Summary:${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Installation is complete.${NC}"
    echo ""
    echo "Ready to start:"
    echo "  ./start-all.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found (non-critical)${NC}"
    echo ""
    echo "You can still start the application:"
    echo "  ./start-all.sh"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    fi
    echo ""
    echo "Please fix errors before starting."
    echo "Run ./setup.sh to fix issues automatically."
    exit 1
fi
