# Use Node.js with Debian base for better compatibility
FROM node:20-bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    pkg-config \
    python3-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment and install Python packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python packages in virtual environment
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir manim edge-tts

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories for video/audio output
RUN mkdir -p public/videos public/audio

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
