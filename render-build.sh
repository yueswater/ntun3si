#!/usr/bin/env bash
# Render build script for full-stack deployment

set -o errexit

# Project-local vendor directory (persists to runtime)
VENDOR_DIR="$(pwd)/vendor"
QUARTO_DIR="$VENDOR_DIR/quarto"
TINYTEX_DIR="$VENDOR_DIR/TinyTeX"
FONTS_DIR="$VENDOR_DIR/fonts"

# ── Step 1: Install Quarto + TinyTeX + cwTeX (for PDF generation) ──
if [ ! -f "$QUARTO_DIR/bin/quarto" ]; then
  echo "=== Installing Quarto CLI... ==="
  QUARTO_VERSION="1.6.43"
  wget -q "https://github.com/quarto-dev/quarto-cli/releases/download/v${QUARTO_VERSION}/quarto-${QUARTO_VERSION}-linux-amd64.deb"
  mkdir -p "$VENDOR_DIR/quarto-extract"
  dpkg -x "quarto-${QUARTO_VERSION}-linux-amd64.deb" "$VENDOR_DIR/quarto-extract"
  mv "$VENDOR_DIR/quarto-extract/opt/quarto" "$QUARTO_DIR"
  rm -rf "quarto-${QUARTO_VERSION}-linux-amd64.deb" "$VENDOR_DIR/quarto-extract"
  echo "Quarto $($QUARTO_DIR/bin/quarto --version) installed"
fi

export PATH="$QUARTO_DIR/bin:$PATH"

if [ ! -d "$TINYTEX_DIR" ]; then
  echo "=== Installing TinyTeX (direct download)... ==="
  export TINYTEX_DIR="$TINYTEX_DIR"
  wget -q "https://yihui.org/tinytex/install-bin-unix.sh" -O /tmp/install-tinytex.sh
  # Install TinyTeX to vendor directory
  TINYTEX_INSTALLER_DIR="$HOME" sh /tmp/install-tinytex.sh
  # Move from default location to vendor
  if [ -d "$HOME/.TinyTeX" ]; then
    mv "$HOME/.TinyTeX" "$TINYTEX_DIR"
  fi
  echo "TinyTeX installed to $TINYTEX_DIR"
fi

export PATH="$TINYTEX_DIR/bin/x86_64-linux:$PATH"

echo "=== Installing LaTeX CJK packages... ==="
tlmgr install ctex xecjk fontspec fancyhdr ulem environ \
  trimspaces zhnumber tcolorbox pgf etoolbox || true

echo "=== Installing cwTeX fonts... ==="
mkdir -p "$FONTS_DIR"
cd "$FONTS_DIR"
for font in cwTeXMing cwTeXKai cwTeXYen cwTeXHei cwTeXFangSong; do
  if [ ! -f "${font}.ttf" ]; then
    wget -q "https://github.com/l10n-tw/cwtex-q-fonts/raw/master/${font}.ttf" || true
  fi
done
# Also link to system font location
mkdir -p "$HOME/.fonts"
ln -sf "$FONTS_DIR"/*.ttf "$HOME/.fonts/" 2>/dev/null || true
fc-cache -f 2>/dev/null || true
cd -

# ── Step 2: Node.js build ──
echo "=== Installing root dependencies... ==="
npm install --include=dev

echo "=== Installing client dependencies... ==="
npm install --include=dev --prefix src/client

echo "=== Building client app... ==="
npm run build --prefix src/client

echo "=== Generating Sitemap... ==="
node generate-sitemap.js

echo "=== Build completed successfully! ==="
