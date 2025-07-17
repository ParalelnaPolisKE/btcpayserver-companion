#!/bin/bash

# Interactive shell in the Linux build environment
# Useful for debugging build issues

echo "🐧 Starting interactive Linux build environment..."
echo "This gives you a shell inside the build container."
echo ""

# Build the Docker image first
docker compose -f docker-compose.build.yml build

# Run interactive shell
docker compose -f docker-compose.build.yml run --rm --entrypoint /bin/bash tauri-linux-builder

echo "👋 Exited Linux build environment"