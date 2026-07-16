# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-alpine

# ---- base: shared setup ----
FROM node:${NODE_VERSION} AS base
WORKDIR /usr/src/app
RUN apk add --no-cache dumb-init
RUN addgroup -S nodejs && adduser -S expressjs -u 1001 -G nodejs

# ---- deps: full deps (incl. dev) for local development / hot reload ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- deps-prod: production-only deps ----
FROM base AS deps-prod
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- development: run source directly with node --watch ----
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs && chown -R expressjs:nodejs /usr/src/app
USER expressjs
EXPOSE 3000
CMD ["dumb-init", "node", "--watch", "src/index.js"]

# ---- production: minimal runtime image ----
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps-prod /usr/src/app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs && chown -R expressjs:nodejs /usr/src/app
USER expressjs
EXPOSE 3000
CMD ["dumb-init", "node", "src/index.js"]
