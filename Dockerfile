# StatLin – produktionsbild (Next.js standalone + SQLite)
# Bygg:  docker build -t statlin-web .
# Kör:   docker compose up -d   (se docker-compose.yml)

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Byggverktyg behövs bara om better-sqlite3 saknar förbyggd binär för plattformen.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data
RUN groupadd --system --gid 1001 statlin && useradd --system --uid 1001 --gid statlin statlin \
    && mkdir -p /data && chown statlin:statlin /data
COPY --from=build --chown=statlin:statlin /app/.next/standalone ./
COPY --from=build --chown=statlin:statlin /app/.next/static ./.next/static
COPY --from=build --chown=statlin:statlin /app/public ./public
COPY --from=build --chown=statlin:statlin /app/scripts/create-admin.mjs ./scripts/create-admin.mjs
USER statlin
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
