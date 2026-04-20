# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies and built assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Standard production environment
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main"]
