# Official Debian-based Node.js runtime for Linux (Node 22 with WASM Exception Support)
FROM node:22-bookworm-slim

# Set working directory
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy server application source
COPY src/ ./src/

# Expose backend port
EXPOSE 5001

# Environment settings
ENV NODE_ENV=production
ENV PORT=5001

# Start the Microsoft SEAL CKKS Evaluator server with WASM flags
CMD ["node", "--experimental-wasm-exnref", "src/server.js"]
