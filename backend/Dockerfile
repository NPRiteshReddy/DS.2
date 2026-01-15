# Use Node.js base image with Python support
FROM node:20-bullseye

# Install system dependencies for Manim and FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    texlive \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-latex-recommended \
    texlive-science \
    tipa \
    libffi-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages for video generation
RUN pip3 install --no-cache-dir \
    manim \
    edge-tts \
    numpy

# Verify installations
RUN python3 --version && \
    ffmpeg -version && \
    manim --version

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories for video/audio output
RUN mkdir -p public/videos public/audio

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start the server
CMD ["npm", "start"]
