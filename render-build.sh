#!/usr/bin/env bash
# Render build script for full-stack deployment

set -o errexit

echo "Installing root dependencies (including devDependencies)..."
npm install --include=dev

echo "Installing and building client..."
npm install --include=dev --prefix src/client
npm run build --prefix src/client

echo "Build completed successfully!"
