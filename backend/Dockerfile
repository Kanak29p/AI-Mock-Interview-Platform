# Multi-stage Dockerfile for Node.js Express Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source and config
COPY tsconfig.json ./
COPY src/ ./src/

# Copy schema SQL for migration
RUN npm run build
RUN cp src/db/schema.sql dist/db/schema.sql

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install curl for docker healthcheck
RUN apk add --no-cache curl

# Copy production package manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/schema.sql ./dist/db/schema.sql

EXPOSE 5000

CMD ["node", "dist/server.js"]
