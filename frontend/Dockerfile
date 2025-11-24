# Frontend Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create .env file with default values if not exists
RUN if [ ! -f .env ]; then echo "VITE_API_URL=http://localhost:8000" > .env; fi

# Build the application
RUN npm run build 2>&1 || (echo "Build failed. Checking for errors..." && ls -la && exit 1)

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
