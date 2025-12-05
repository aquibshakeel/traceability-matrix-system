FROM node:18-alpine

# Set working directory
WORKDIR /qa

# Install dependencies for Playwright (if needed later)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Playwright to use installed chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy test files and matrix files
COPY tests ./tests
COPY matrix ./matrix
COPY scripts ./scripts
COPY .mocharc.json ./

# Create reports directory
RUN mkdir -p reports/html reports/screenshots

# Run tests by default
CMD ["npm", "run", "test:report"]
