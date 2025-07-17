#!/bin/bash

# Build script for Linux binaries using Docker on macOS

set -e

echo "🐧 Building Linux binaries using Docker..."
echo "This may take a while on first run as it downloads dependencies."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Clean previous builds (optional)
if [ "$1" == "--clean" ]; then
    echo "🧹 Cleaning previous builds..."
    rm -rf src-tauri/target/release/bundle
fi

# Build the Docker image and run the build
echo "🔨 Building Tauri app for Linux..."
docker compose -f docker-compose.build.yml build
docker compose -f docker-compose.build.yml run --rm tauri-linux-builder

# Check if build was successful
if [ -d "src-tauri/target/release/bundle" ]; then
    echo ""
    echo "✅ Build successful! Linux binaries are available in:"
    echo ""
    
    # List the generated files
    if [ -f src-tauri/target/release/bundle/deb/*.deb ]; then
        echo "📦 Debian package (.deb):"
        ls -la src-tauri/target/release/bundle/deb/*.deb 2>/dev/null || true
    fi
    
    if [ -f src-tauri/target/release/bundle/appimage/*.AppImage ]; then
        echo ""
        echo "📦 AppImage:"
        ls -la src-tauri/target/release/bundle/appimage/*.AppImage 2>/dev/null || true
    fi
    
    if [ -f src-tauri/target/release/bundle/rpm/*.rpm ]; then
        echo ""
        echo "📦 RPM package:"
        ls -la src-tauri/target/release/bundle/rpm/*.rpm 2>/dev/null || true
    fi
else
    echo "❌ Build failed. Check the logs above for errors."
    exit 1
fi