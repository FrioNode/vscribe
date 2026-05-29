FROM node:22-slim

WORKDIR /app

# Install Python, ffmpeg, build tools
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    ffmpeg curl make g++ supervisor \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Node deps
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY api/ api/
COPY worker/ worker/
COPY tsconfig.json ./

# Dirs
RUN mkdir -p /app/data /app/cache/transcriptions

# Supervisord config
COPY supervisord.conf /etc/supervisord.conf

EXPOSE 3000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]