#!/usr/bin/env bash
# Render build script for full-stack deployment

set -o errexit

echo "=== Step 1: Installing root dependencies... ==="
npm install --include=dev

echo "=== Step 2: Installing client dependencies... ==="
npm install --include=dev --prefix src/client

echo "=== Step 3: Building client app... ==="
npm run build --prefix src/client

echo "=== Step 4: Generating Sitemap... ==="
node generate-sitemap.js

echo "=== Build completed successfully! ==="
