# Multi-stage Dockerfile for PPM Project
# Supports both development and production builds

# ===========================================
# Base Node.js Image
# ===========================================
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    git

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ppm -u 1001

# ===========================================
# Development Stage
# ===========================================
FROM base AS development

# Install development dependencies
RUN apk add --no-cache \
    vim \
    bash \
    openssh

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Change ownership to non-root user
RUN chown -R ppm:nodejs /app

# Switch to non-root user
USER ppm

# Expose ports
EXPOSE 3000 9229

# Development command with nodemon
CMD ["npm", "run", "dev"]

# ===========================================
# Production Dependencies Stage
# ===========================================
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# ===========================================
# Build Stage
# ===========================================
FROM base AS build

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# ===========================================
# Production Stage
# ===========================================
FROM base AS production

# Set production environment
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Create uploads directory
RUN mkdir -p uploads logs && \
    chown -R ppm:nodejs uploads logs

# Change ownership to non-root user
RUN chown -R ppm:nodejs /app

# Switch to non-root user
USER ppm

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Production command
CMD ["npm", "start"]

# ===========================================
# Frontend Development Stage
# ===========================================
FROM node:20-alpine AS frontend-dev

WORKDIR /app

# Install dependencies for frontend
RUN apk add --no-cache curl

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontend -u 1001 && \
    chown -R frontend:nodejs /app

USER frontend

# Expose Vite dev server port
EXPOSE 5173

# Development command
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ===========================================
# Frontend Production Stage
# ===========================================
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ .

# Build frontend
RUN npm run build

# Nginx stage for frontend production
FROM nginx:alpine AS frontend-prod

# Copy built frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/frontend.nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]