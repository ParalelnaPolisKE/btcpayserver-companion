# Building BTCPay Companion

This guide covers building the BTCPay Companion app for different platforms.

## Prerequisites

### For macOS builds:
- macOS with Xcode Command Line Tools
- Rust (install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- Bun (install via `curl -fsSL https://bun.sh/install | bash`)

### For Linux builds on macOS:
- Docker Desktop for Mac
- All macOS prerequisites above

## Building for macOS

### Development
```bash
bun run tauri:dev
```

### Production Build (Universal Binary)
```bash
# First build Next.js
bun run build

# Then build Tauri app (creates universal binary for Intel and Apple Silicon)
bun run tauri:build:universal
```

The macOS app will be in:
- DMG: `src-tauri/target/universal-apple-darwin/release/bundle/dmg/`
- App Bundle: `src-tauri/target/universal-apple-darwin/release/bundle/macos/`

## Building for Linux (on macOS using Docker)

### First-time Setup
1. Install Docker Desktop for Mac
2. Start Docker Desktop
3. The build script will handle the rest

### Build Linux Binaries
```bash
# Clean build (removes previous artifacts)
bun run tauri:build:linux --clean

# Regular build (uses cache)
bun run tauri:build:linux
```

This will produce:
- **Debian Package (.deb)**: For Ubuntu, Debian, and derivatives
- **AppImage**: Universal Linux binary that runs on most distributions
- **RPM Package (.rpm)**: For Fedora, RHEL, openSUSE, and derivatives

Output files will be in:
- DEB: `src-tauri/target/release/bundle/deb/`
- AppImage: `src-tauri/target/release/bundle/appimage/`
- RPM: `src-tauri/target/release/bundle/rpm/`

### Build All Platforms
```bash
# Builds both macOS universal binary and Linux packages
bun run tauri:build:all
```

## GitHub Actions (Automated Builds)

The project includes GitHub Actions workflows that automatically build for all platforms.

### Triggering Builds
- **Push to main**: Builds artifacts for testing
- **Create a tag**: Builds and creates a GitHub release
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

### Manual Trigger
You can also trigger builds manually from the GitHub Actions tab.

## Docker Build Details

The Docker build uses Ubuntu 22.04 and includes all necessary dependencies:
- WebKit2GTK 4.1 (Web rendering engine)
- GTK 3 (UI toolkit)
- AppIndicator (System tray support)
- Various build tools

### Troubleshooting Docker Builds

1. **Docker not running**
   ```
   Error: Docker is not running
   Solution: Start Docker Desktop
   ```

2. **Slow first build**
   - First build downloads all dependencies (~1-2GB)
   - Subsequent builds use cache and are much faster

3. **Out of disk space**
   ```bash
   # Clean Docker cache
   docker system prune -a
   ```

4. **Permission issues**
   - The build script should handle permissions automatically
   - If issues persist, try: `sudo chown -R $(whoami) src-tauri/target`

## Build Configuration

### Environment Variables
- `TAURI_SIGNING_PRIVATE_KEY`: For code signing (optional)
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Password for signing key (optional)

### Linux Package Dependencies
Configured in `src-tauri/tauri.conf.json`:
- **DEB**: webkit2gtk-4.1, libgtk-3-0, libayatana-appindicator3-1
- **RPM**: webkit2gtk4.1, gtk3, libappindicator-gtk3
- **AppImage**: Bundles all dependencies

## Distribution

### Manual Distribution
1. Build the app for your target platform
2. Share the appropriate file:
   - **macOS**: Share the .dmg file
   - **Linux DEB**: For Ubuntu/Debian users
   - **Linux AppImage**: For any Linux distribution
   - **Linux RPM**: For Fedora/RHEL users

### Automated Release
Tags starting with 'v' trigger automated releases:
```bash
git tag v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This creates a GitHub release with all platform binaries attached.

## Security Notes

- The app is built with ad-hoc signing for macOS
- Linux packages are unsigned (users may need to allow installation)
- API keys are stored in localStorage (consider platform-specific secure storage for production)