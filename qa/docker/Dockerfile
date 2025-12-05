FROM node:18-alpine

# Install required tools
RUN apk add --no-cache \
    bash \
    git \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Playwright to use installed chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /qa

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./
COPY .mocharc.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY tests ./tests
COPY matrix ./matrix
COPY scripts ./scripts

# Create reports directory with proper permissions
RUN mkdir -p reports/html reports/screenshots && \
    chmod -R 777 reports

# Make scripts executable
RUN chmod +x scripts/*.sh

# Default command - can be overridden
CMD ["npm", "run", "test:all"]
