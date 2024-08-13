apt-get update && apt-get install -y \
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
    x11-utils

echo "Starting Node.js server..."
npm start