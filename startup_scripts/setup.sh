#!/bin/bash

# Photo Proof - Initial Setup Script
# Supports: macOS, Linux (Ubuntu/Debian, CentOS/RHEL, Arch)
# Sets up both frontend and backend from scratch

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script version
VERSION="1.0.0"

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║         Photo Proof - Initial Setup v${VERSION}        ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        echo -e "${BLUE}Detected OS: macOS${NC}"
    elif [[ -f /etc/debian_version ]]; then
        OS="debian"
        echo -e "${BLUE}Detected OS: Debian/Ubuntu Linux${NC}"
    elif [[ -f /etc/redhat-release ]]; then
        OS="redhat"
        echo -e "${BLUE}Detected OS: RedHat/CentOS/Fedora Linux${NC}"
    elif [[ -f /etc/arch-release ]]; then
        OS="arch"
        echo -e "${BLUE}Detected OS: Arch Linux${NC}"
    else
        OS="unknown"
        echo -e "${YELLOW}Unknown OS, will attempt generic setup${NC}"
    fi
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install system dependencies
install_system_dependencies() {
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  1. Installing System Dependencies${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo ""
    
    case $OS in
        macos)
            # Check for Homebrew
            if ! command_exists brew; then
                echo -e "${YELLOW}Installing Homebrew...${NC}"
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            else
                echo -e "${GREEN}✓ Homebrew already installed${NC}"
            fi
            ;;
        debian)
            echo -e "${YELLOW}Updating package list...${NC}"
            sudo apt-get update -qq
            echo -e "${YELLOW}Installing build essentials...${NC}"
            sudo apt-get install -y build-essential curl wget git
            ;;
        redhat)
            echo -e "${YELLOW}Installing development tools...${NC}"
            sudo yum groupinstall -y "Development Tools"
            sudo yum install -y curl wget git
            ;;
        arch)
            echo -e "${YELLOW}Installing base-devel...${NC}"
            sudo pacman -Sy --noconfirm base-devel curl wget git
            ;;
    esac
    
    echo ""
}

# Install Python
install_python() {
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  2. Setting Up Python${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo ""
    
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        echo -e "${GREEN}✓ Python already installed: $PYTHON_VERSION${NC}"
    else
        echo -e "${YELLOW}Installing Python 3...${NC}"
        case $OS in
            macos)
                brew install python@3.11
                ;;
            debian)
                sudo apt-get install -y python3 python3-pip python3-venv
                ;;
            redhat)
                sudo yum install -y python3 python3-pip
                ;;
            arch)
                sudo pacman -S --noconfirm python python-pip
                ;;
        esac
    fi
    
    # Ensure pip is installed
    if ! command_exists pip3; then
        echo -e "${YELLOW}Installing pip...${NC}"
        python3 -m ensurepip --default-pip 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Python setup complete${NC}"
    echo ""
}

# Install Node.js
install_nodejs() {
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  3. Setting Up Node.js${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo ""
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✓ Node.js already installed: $NODE_VERSION${NC}"
    else
        echo -e "${YELLOW}Installing Node.js...${NC}"
        case $OS in
            macos)
                brew install node
                ;;
            debian)
                curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                sudo apt-get install -y nodejs
                ;;
            redhat)
                curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                sudo yum install -y nodejs
                ;;
            arch)
                sudo pacman -S --noconfirm nodejs npm
                ;;
        esac
    fi
    
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
    fi
    
    echo ""
}

# Setup Backend
setup_backend() {
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  4. Setting Up Backend (Python/FastAPI)${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo ""
    
    if [ ! -d "photo_proof_api" ]; then
        echo -e "${RED}✗ photo_proof_api directory not found${NC}"
        echo -e "${YELLOW}Please ensure you're running this from the v0_photo_proof directory${NC}"
        return 1
    fi
    
    cd photo_proof_api
    
    echo -e "${BLUE}→ Creating Python virtual environment...${NC}"
    if [ -d ".venv" ]; then
        echo -e "${YELLOW}  .venv already exists, skipping creation${NC}"
    else
        python3 -m venv .venv
        echo -e "${GREEN}✓ Virtual environment created${NC}"
    fi
    
    echo -e "${BLUE}→ Activating virtual environment...${NC}"
    source .venv/bin/activate
    
    echo -e "${BLUE}→ Upgrading pip...${NC}"
    pip install --upgrade pip -q
    
    echo -e "${BLUE}→ Installing Python dependencies...${NC}"
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt -q
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${RED}✗ requirements.txt not found${NC}"
    fi
    
    echo -e "${BLUE}→ Setting up environment file...${NC}"
    if [ ! -f ".env" ]; then
        cat > .env << 'EOF'
# Photo Proof API Configuration

# Database
DATABASE_URL=sqlite:///./photo_proof.db

# Security (CHANGE IN PRODUCTION!)
SECRET_KEY=change-this-secret-key-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Storage
USE_S3=false
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760

# CORS - Wildcard patterns allow any IP address for network access
CORS_ORIGINS=http://*.*.*.*:3001,http://*.*.*.*:8000,http://localhost:3001,http://localhost:8000,http://localhost:5173,http://localhost:3000

# Environment
ENVIRONMENT=development
EOF
        echo -e "${GREEN}✓ .env file created${NC}"
    else
        echo -e "${YELLOW}  .env already exists, skipping${NC}"
    fi
    
    echo -e "${BLUE}→ Creating necessary directories...${NC}"
    mkdir -p uploads data logs
    echo -e "${GREEN}✓ Directories created${NC}"
    
    echo -e "${BLUE}→ Initializing database...${NC}"
    if [ -f "quickstart.py" ]; then
        python quickstart.py 2>/dev/null || echo -e "${YELLOW}  Database may already be initialized${NC}"
    fi
    
    deactivate 2>/dev/null || true
    cd ..
    
    echo -e "${GREEN}✓ Backend setup complete${NC}"
    echo ""
}

# Setup Frontend
setup_frontend() {
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  5. Setting Up Frontend (React/Vite)${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo ""
    
    if [ ! -d "Photo_Proof_v1" ]; then
        echo -e "${RED}✗ Photo_Proof_v1 directory not found${NC}"
        echo -e "${YELLOW}Please ensure you're running this from the v0_photo_proof directory${NC}"
        return 1
    fi
    
    cd Photo_Proof_v1
    
    echo -e "${BLUE}→ Installing Node.js dependencies...${NC}"
    if [ -d "node_modules" ]; then
        echo -e "${YELLOW}  node_modules exists, running clean install...${NC}"
        npm ci -q 2>/dev/null || npm install -q
    else
        npm install -q
    fi
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    
    echo -e "${BLUE}→ Verifying Tailwind CSS installation...${NC}"
    if ! npm list @tailwindcss/postcss >/dev/null 2>&1; then
        echo -e "${YELLOW}  Tailwind CSS packages missing, installing...${NC}"
        npm install -D @tailwindcss/postcss tailwindcss postcss autoprefixer -q
        echo -e "${GREEN}✓ Tailwind CSS packages installed${NC}"
    else
        echo -e "${GREEN}✓ Tailwind CSS already installed${NC}"
    fi
    
    echo -e "${BLUE}→ Setting up environment file...${NC}"
    if [ ! -f ".env.local" ]; then
        cat > .env.local << 'EOF'
# Frontend Environment Variables
VITE_API_URL=/api
EOF
        echo -e "${GREEN}✓ .env.local file created${NC}"
    else
        echo -e "${YELLOW}  .env.local already exists, skipping${NC}"
    fi
    
    cd ..
    
    echo -e "${GREEN}✓ Frontend setup complete${NC}"
    echo ""
}

# Get network IP
get_network_ip() {
    if [[ "$OS" == "macos" ]]; then
        ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1
    else
        hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 | awk '{print $7}' | head -n 1
    fi
}

# Create startup scripts
create_startup_scripts() {
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  6. Creating Startup Scripts${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo ""
    
    # Backend start script
    if [ ! -f "photo_proof_api/start.sh" ]; then
        echo -e "${BLUE}→ Creating backend startup script...${NC}"
        cat > photo_proof_api/start.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

echo "🚀 Starting Photo Proof API..."

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found. Run setup.sh first."
    exit 1
fi

# Get network IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
else
    NETWORK_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 | awk '{print $7}' | head -n 1)
fi

echo ""
echo "🚀 Photo Proof API Server"
echo "=================================================="
echo "📍 Local:   http://localhost:8000"
echo "🌐 Network: http://${NETWORK_IP}:8000"
echo "📚 Docs:    http://localhost:8000/docs"
echo "=================================================="
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server
python main.py
EOFSCRIPT
        chmod +x photo_proof_api/start.sh
        echo -e "${GREEN}✓ Backend startup script created${NC}"
    else
        echo -e "${YELLOW}  Backend start.sh already exists${NC}"
    fi
    
    # Frontend start script
    if [ ! -f "Photo_Proof_v1/start.sh" ]; then
        echo -e "${BLUE}→ Creating frontend startup script...${NC}"
        cat > Photo_Proof_v1/start.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

echo "🎨 Starting Photo Proof Frontend..."
echo ""

npm run dev
EOFSCRIPT
        chmod +x Photo_Proof_v1/start.sh
        echo -e "${GREEN}✓ Frontend startup script created${NC}"
    else
        echo -e "${YELLOW}  Frontend start.sh already exists${NC}"
    fi
    
    # All-in-one start script already exists (start-all.sh)
    if [ -f "start-all.sh" ]; then
        echo -e "${GREEN}✓ start-all.sh already exists${NC}"
    fi
    
    echo ""
}

# Print summary
print_summary() {
    NETWORK_IP=$(get_network_ip)
    
    echo ""
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════╗"
    echo "║                                                   ║"
    echo "║           🎉 Setup Complete! 🎉                  ║"
    echo "║                                                   ║"
    echo "╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${GREEN}✓ System dependencies installed${NC}"
    echo -e "${GREEN}✓ Python environment configured${NC}"
    echo -e "${GREEN}✓ Node.js environment configured${NC}"
    echo -e "${GREEN}✓ Backend setup complete${NC}"
    echo -e "${GREEN}✓ Frontend setup complete${NC}"
    echo ""
    echo -e "${BLUE}═════════════════════════════════════${NC}"
    echo -e "${BLUE}  Next Steps - Starting the Application${NC}"
    echo -e "${BLUE}═════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Option 1: Start Everything (Recommended)${NC}"
    echo "  ./start-all.sh"
    echo ""
    echo -e "${YELLOW}Option 2: Start Services Separately${NC}"
    echo "  Terminal 1 (Backend):"
    echo "    cd photo_proof_api && ./start.sh"
    echo ""
    echo "  Terminal 2 (Frontend):"
    echo "    cd Photo_Proof_v1 && npm run dev"
    echo ""
    echo -e "${BLUE}═════════════════════════════════════${NC}"
    echo -e "${BLUE}  Access URLs${NC}"
    echo -e "${BLUE}═════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Desktop Browser:${NC}"
    echo "  Frontend: http://localhost:3001"
    echo "  Backend:  http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    echo -e "${GREEN}Mobile Device (same WiFi):${NC}"
    echo "  Frontend: http://${NETWORK_IP}:3001"
    echo "  Backend:  http://${NETWORK_IP}:8000"
    echo ""
    echo -e "${YELLOW}⚠️  Firewall Note:${NC}"
    echo "  If mobile access doesn't work, see:"
    echo "    - MOBILE_ACCESS_SETUP.md (detailed setup)"
    echo "    - FIREWALL_FIX.md (troubleshooting)"
    echo "  Or run: ./test-network.sh"
    echo ""
    echo -e "${BLUE}═════════════════════════════════════${NC}"
    echo ""
}

# Main setup flow
main() {
    detect_os
    
    # Ask for confirmation
    echo -e "${YELLOW}This script will:${NC}"
    echo "  • Install system dependencies (may require sudo)"
    echo "  • Install/verify Python 3"
    echo "  • Install/verify Node.js & npm"
    echo "  • Set up backend Python environment"
    echo "  • Install frontend dependencies"
    echo "  • Create configuration files"
    echo ""
    read -p "Continue with setup? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Setup cancelled${NC}"
        exit 1
    fi
    
    echo ""
    
    install_system_dependencies
    install_python
    install_nodejs
    setup_backend
    setup_frontend
    create_startup_scripts
    print_summary
}

# Run main function
main
