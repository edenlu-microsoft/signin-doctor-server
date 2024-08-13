FROM node:18

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libgconf-2-4 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libxtst6 \
    x11-utils \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6

# Clear npm cache
RUN npm cache clean --force

# Install Chrome using Puppeteer
RUN npx puppeteer browsers install chrome

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["npm", "start"]