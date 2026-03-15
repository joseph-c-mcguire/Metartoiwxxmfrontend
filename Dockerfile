# Development stage
FROM node:20-alpine AS dev

WORKDIR /app

# Accept development-time Vite environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ARG VITE_APP_URL
ARG VITE_BACKEND_URL
ARG VITE_AUTH_SERVICE_URL

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}
ENV VITE_APP_URL=${VITE_APP_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_AUTH_SERVICE_URL=${VITE_AUTH_SERVICE_URL}

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8000"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ARG VITE_APP_URL
ARG VITE_BACKEND_URL
ARG VITE_AUTH_SERVICE_URL

# Set them as environment variables for the build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}
ENV VITE_APP_URL=${VITE_APP_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_AUTH_SERVICE_URL=${VITE_AUTH_SERVICE_URL}

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
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
