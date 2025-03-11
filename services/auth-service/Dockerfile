# Build stage
FROM node:16-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Run tests and linting
RUN npm run test
RUN npm run lint

# Development stage
FROM node:16-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5002

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM node:16-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV AUTH_SERVICE_PORT=5002

# Expose port
EXPOSE 5002

# Start production server
CMD ["node", "src/index.js"] 