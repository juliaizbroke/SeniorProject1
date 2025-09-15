#!/bin/bash

# Exam Generator - Easy Setup Script for Mac/Linux
# This script will install all dependencies and start the application

set -e  # Exit on any error

echo "🎓 Exam Generator - Easy Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -d "frontend" ]] || [[ ! -d "backend" ]]; then
    print_error "Please run this script from the project root directory"
    print_error "Make sure you can see 'frontend' and 'backend' folders"
    exit 1
fi

# Check for Python
print_status "Checking for Python..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    print_success "Found Python 3: $(python3 --version)"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1)
    if [[ $PYTHON_VERSION == *"Python 3"* ]]; then
        PYTHON_CMD="python"
        print_success "Found Python 3: $PYTHON_VERSION"
    else
        print_error "Python 3 is required. Found: $PYTHON_VERSION"
        echo "Please install Python 3.8 or higher from https://python.org"
        exit 1
    fi
else
    print_error "Python 3 is not installed!"
    echo "Please install Python 3.8 or higher from https://python.org"
    exit 1
fi

# Check for Node.js
print_status "Checking for Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Found Node.js: $NODE_VERSION"
else
    print_error "Node.js is not installed!"
    echo "Please install Node.js 18 or higher from https://nodejs.org"
    exit 1
fi

# Check for npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "Found npm: $NPM_VERSION"
else
    print_error "npm is not installed!"
    echo "Please install Node.js which includes npm from https://nodejs.org"
    exit 1
fi

echo ""
print_status "Starting installation process..."
echo ""

# Install Python dependencies
print_status "Installing Python dependencies..."
cd backend

# Create virtual environment if it doesn't exist
if [[ ! -d "venv" ]]; then
    print_status "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
print_status "Activating Python virtual environment..."
source venv/bin/activate

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install requirements
print_status "Installing Python packages..."
pip install -r requirements.txt

print_success "Python dependencies installed successfully!"

# Go back to root and install Node.js dependencies
cd ../frontend
print_status "Installing Node.js dependencies..."
npm install

print_success "Node.js dependencies installed successfully!"

echo ""
print_status "Building the application for Electron..."

# Set environment variable for Electron build
export ELECTRON=true

# Build the frontend
npm run build

print_success "Application built successfully!"

echo ""
print_status "Starting the Exam Generator..."
echo ""

# Start the application
npm run electron

print_success "Application started!"

echo ""
print_success "Setup completed successfully!"
echo "Next time, you can run the application directly with:"
echo "  cd frontend && npm run electron"
echo ""
