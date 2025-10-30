#!/usr/bin/env bash
# Render build script for full-stack deployment

set -e

echo "Installing dependencies..."
npm install

echo "Building frontend..."
cd src/client
npm install
npm run build
cd ../..

echo "Build completed successfully!"