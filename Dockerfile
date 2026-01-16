# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ARG VITE_APP_URL
ARG VITE_BACKEND_URL
ARG VITE_AUTH_URL

# Set them as environment variables for the build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}
ENV VITE_APP_URL=${VITE_APP_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_AUTH_URL=${VITE_AUTH_URL}

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application (Vite will use the environment variables)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing - serve index.html for all non-file requests
    location / {
        # First check if the request is for an actual file/directory
        try_files \$uri \$uri/ /index.html;
    }

    # Explicitly handle /auth/callback path (Supabase email verification redirect)
    # Serve index.html which will handle the hash-based routing
    location /auth/callback {
        rewrite ^ /index.html break;
    }

    # Proxy API requests to backend service
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Proxy auth requests to auth service (but NOT /auth/callback which is for SPA)
    # Note: When using regex, proxy_pass cannot have URI path - it must be just the upstream
    location ~ ^/auth/(?!callback) {
        proxy_pass http://auth:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
