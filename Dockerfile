# ──────────────────────────────────────────────
# Stage 1 – Build the Vite client
# ──────────────────────────────────────────────
FROM node:22-slim AS client-builder

WORKDIR /app

# Install root deps (for generate-sitemap, etc.)
COPY package.json package-lock.json* ./
RUN npm install --include=dev

# Install client deps
COPY src/client/package.json src/client/package-lock.json* ./src/client/
RUN npm install --include=dev --prefix src/client

# Copy full source and build
COPY . .
RUN npm run build --prefix src/client && node generate-sitemap.js

# ──────────────────────────────────────────────
# Stage 2 – Runtime with Quarto + cwTeX
# ──────────────────────────────────────────────
FROM node:22-slim AS runtime

# System deps: wget, fontconfig (for cwTeX), Quarto's deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget curl ca-certificates fontconfig xdg-utils \
    libglib2.0-0 libxml2 \
    && rm -rf /var/lib/apt/lists/*

# ── Install Quarto CLI ──
ARG QUARTO_VERSION=1.6.43
RUN wget -q "https://github.com/quarto-dev/quarto-cli/releases/download/v${QUARTO_VERSION}/quarto-${QUARTO_VERSION}-linux-amd64.deb" \
    && dpkg -i "quarto-${QUARTO_VERSION}-linux-amd64.deb" \
    && rm "quarto-${QUARTO_VERSION}-linux-amd64.deb"

# ── Install TinyTeX (LaTeX engine for PDF) ──
RUN quarto install tinytex --update-path

# ── Install cwTeX fonts ──
RUN mkdir -p /usr/share/fonts/truetype/cwtex \
    && cd /usr/share/fonts/truetype/cwtex \
    && for font in cwTeXMing cwTeXKai cwTeXYen cwTeXHei cwTeXFangSong; do \
    wget -q "https://github.com/l10n-tw/cwtex-q-fonts/raw/master/${font}.ttf" || true; \
    done \
    && fc-cache -fv

# ── Install extra LaTeX packages for CJK/xelatex ──
ENV PATH="/root/bin:${PATH}"
RUN tlmgr install ctex xecjk fontspec fancyhdr ulem environ \
    trimspaces zhnumber tcolorbox pgf etoolbox || true

WORKDIR /app

# Install only production deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy server source
COPY src/api/ ./src/api/
COPY server.js generate-sitemap.js ./

# Copy built client from stage 1
COPY --from=client-builder /app/src/client/dist ./src/client/dist

# Quarto templates directory (for PDF generation at runtime)
RUN mkdir -p /app/tmp

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
