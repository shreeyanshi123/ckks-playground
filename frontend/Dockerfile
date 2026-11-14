# Stage 1: Build React + SEAL WASM frontend
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy client source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production Nginx Server for Linux
FROM nginx:alpine-slim

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

