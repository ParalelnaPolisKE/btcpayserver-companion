# Personal Distribution Guide

This guide explains how to build and share the PPKE BTCPay Companion app with friends.

## Prerequisites

- Node.js (v18 or higher)
- Rust (install from https://rustup.rs/)
- Git

## Building the App

Simply run:

```bash
./scripts/build-app.sh
```

This will:
1. Install dependencies
2. Build the Next.js frontend
3. Create the app bundle

## macOS Distribution

After building, the app will be at:
```
src-tauri/target/release/bundle/macos/PPKE BTCPay Companion.app
```

### To share with friends:

1. **Create a zip file:**
   - Right-click on "PPKE BTCPay Companion.app"
   - Select "Compress"
   - Share the resulting .zip file

2. **First time opening:**
   - Recipients should right-click the app and select "Open"
   - Or they may need to go to System Preferences > Security & Privacy to allow it
   - This is only needed the first time

## Linux Distribution

After building, you'll have:
- **AppImage**: `src-tauri/target/release/bundle/appimage/*.AppImage`
  - Self-contained, works on most Linux distributions
  - Just share the file directly
  
- **Debian package**: `src-tauri/target/release/bundle/deb/*.deb`
  - For Debian/Ubuntu users
  - Install with: `sudo dpkg -i package.deb`

## Notes

- The app uses ad-hoc signing on macOS (no Developer ID required)
- No notarization needed for personal distribution
- Recipients may see security warnings on first launch - this is normal
- The app requires an internet connection to work with BTCPayServer

## Updating the Version

Before building a new version:
1. Update version in `src-tauri/tauri.conf.json`
2. Update version in `src-tauri/Cargo.toml`
3. Update version in `package.json`