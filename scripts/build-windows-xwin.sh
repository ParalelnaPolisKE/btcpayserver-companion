#!/bin/bash

# Script for building Windows binaries on macOS using cargo-xwin

set -e

echo "🪟 Building Windows binaries using cargo-xwin..."

# Set XWIN_ARCH for the Windows SDK
export XWIN_ARCH=x86_64

# Path to the Windows SDK
export XWIN_CACHE_DIR="$HOME/.xwin"

# Build the application
echo "Building for x86_64-pc-windows-msvc..."
bun tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis,msi

# Check if build was successful
if [ -f "src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*.exe" ] || [ -f "src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi" ]; then
    echo ""
    echo "✅ Build successful! Windows installers are available in:"
    echo ""
    
    if [ -f src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*.exe ]; then
        echo "📦 NSIS installer (.exe):"
        ls -la src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*.exe 2>/dev/null || true
    fi
    
    if [ -f src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi ]; then
        echo ""
        echo "📦 MSI installer:"
        ls -la src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi 2>/dev/null || true
    fi
else
    echo "❌ Build failed. Check the logs above for errors."
    exit 1
fi