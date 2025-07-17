#!/bin/bash

# Simple build script for personal distribution
# This creates an app bundle that can be shared directly with friends

echo "🚀 Building PPKE BTCPay Companion for personal distribution..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we have the required tools
if ! command -v cargo >/dev/null 2>&1; then
    echo -e "${RED}Error: Rust/Cargo is not installed${NC}"
    echo "Please install from https://rustup.rs/"
    exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
    echo -e "${RED}Error: bun is not installed${NC}"
    echo "Please install Node.js"
    exit 1
fi

# Clean previous builds
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf out
rm -rf src-tauri/target/release/bundle

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
bun install

# Build Next.js app
echo -e "${BLUE}Building Next.js app...${NC}"
bun run build

# Build Tauri app
echo -e "${BLUE}Building Tauri app...${NC}"
cd src-tauri
cargo tauri build

# Check the result
if [[ "$OSTYPE" == "darwin"* ]]; then
    APP_PATH="target/release/bundle/macos/PPKE BTCPay Companion.app"
    if [ -d "$APP_PATH" ]; then
        echo -e "${GREEN}✅ macOS app built successfully!${NC}"
        echo -e "${BLUE}App location: src-tauri/$APP_PATH${NC}"
        echo ""
        echo -e "${GREEN}To share the app:${NC}"
        echo "1. Right-click the app and select 'Compress'"
        echo "2. Share the resulting .zip file"
        echo "3. Recipients may need to right-click and select 'Open' the first time"
        echo "   (or go to System Preferences > Security & Privacy to allow it)"
    else
        echo -e "${RED}Build failed!${NC}"
        exit 1
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    DEB_PATH=$(find target/release/bundle/deb -name "*.deb" -type f 2>/dev/null | head -n 1)
    APPIMAGE_PATH=$(find target/release/bundle/appimage -name "*.AppImage" -type f 2>/dev/null | head -n 1)
    
    if [ -f "$DEB_PATH" ] || [ -f "$APPIMAGE_PATH" ]; then
        echo -e "${GREEN}✅ Linux packages built successfully!${NC}"
        [ -f "$DEB_PATH" ] && echo -e "${BLUE}Debian package: src-tauri/$DEB_PATH${NC}"
        [ -f "$APPIMAGE_PATH" ] && echo -e "${BLUE}AppImage: src-tauri/$APPIMAGE_PATH${NC}"
        echo ""
        echo -e "${GREEN}To share:${NC}"
        echo "- AppImage: Just share the file, it's self-contained"
        echo "- Deb package: Share with Debian/Ubuntu users"
    else
        echo -e "${RED}Build failed!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✨ Done!${NC}"