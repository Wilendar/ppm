# Multi-stage Dockerfile for PPM Backend
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm ci --only=development --ignore-scripts

# Copy source code
COPY src/ ./src/
COPY tests/ ./tests/

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs uploads && \
    chown -R backend:nodejs logs uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
               const options = { host: 'localhost', port: process.env.PORT || 3001, path: '/health', timeout: 2000 }; \
               const request = http.request(options, (res) => { \
                 if (res.statusCode === 200) process.exit(0); \
                 else process.exit(1); \
               }); \
               request.on('error', () => process.exit(1)); \
               request.end();"

# Switch to non-root user
USER backend

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/app.js"]