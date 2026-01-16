# Simple Node.js Dockerfile for Railway
# Video generation with Manim is disabled - uses fast mode instead
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Create directories for output
RUN mkdir -p public/videos public/audio public/uploads

# Expose port (Railway uses PORT env variable)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the server
CMD ["npm", "start"]
