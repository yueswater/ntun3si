#!/usr/bin/env bash
# Render build script for full-stack deployment

set -o errexit

# ── Step 1: Install Quarto + TinyTeX + cwTeX (for PDF generation) ──
if ! command -v quarto &> /dev/null; then
  echo "=== Installing Quarto CLI... ==="
  QUARTO_VERSION="1.6.43"
  wget -q "https://github.com/quarto-dev/quarto-cli/releases/download/v${QUARTO_VERSION}/quarto-${QUARTO_VERSION}-linux-amd64.deb"
  dpkg -x "quarto-${QUARTO_VERSION}-linux-amd64.deb" "$HOME/quarto-extract"
  cp -r "$HOME/quarto-extract/opt/quarto" "$HOME/quarto"
  export PATH="$HOME/quarto/bin:$PATH"
  rm -rf "quarto-${QUARTO_VERSION}-linux-amd64.deb" "$HOME/quarto-extract"
  echo "Quarto $(quarto --version) installed"
fi

if [ ! -d "$HOME/bin" ] || ! command -v tlmgr &> /dev/null; then
  echo "=== Installing TinyTeX... ==="
  quarto install tinytex --update-path
  export PATH="$HOME/bin:$PATH"
fi

echo "=== Installing LaTeX CJK packages... ==="
tlmgr install ctex xecjk fontspec fancyhdr ulem environ \
  trimspaces zhnumber tcolorbox pgf etoolbox || true

echo "=== Installing cwTeX fonts... ==="
mkdir -p "$HOME/.fonts"
cd "$HOME/.fonts"
for font in cwTeXMing cwTeXKai cwTeXYen cwTeXHei cwTeXFangSong; do
  if [ ! -f "${font}.ttf" ]; then
    wget -q "https://github.com/l10n-tw/cwtex-q-fonts/raw/master/${font}.ttf" || true
  fi
done
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
