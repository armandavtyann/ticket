# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for sequelize-cli)
RUN npm ci

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/src/config/database.config.js ./src/config/database.config.js
COPY --from=builder /app/.sequelizerc ./.sequelizerc
# Copy source files needed for scripts (tsx needs TypeScript sources)
COPY --from=builder /app/src/scripts ./src/scripts
COPY --from=builder /app/src/config ./src/config
COPY --from=builder /app/src/models ./src/models
COPY --from=builder /app/src/utils ./src/utils
COPY --from=builder /app/src/types ./src/types

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

CMD ["npm", "start"]
