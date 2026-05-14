# ── Stage 1: build ────────────────────────────────────────────────────────
# "builder" is just a name we give this stage — referenced in Stage 2.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (same caching trick as backend).
COPY package.json package-lock.json ./
RUN npm ci

# VITE_API_URL is baked into the JS bundle at build time.
# We accept it as a build argument so docker-compose can pass it in.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build
# After this stage: /app/dist contains HTML + CSS + JS. Nothing else needed.


# ── Stage 2: serve ────────────────────────────────────────────────────────
# nginx:alpine is ~8 MB. We throw away Node, npm, source code entirely.
# The final image only contains the compiled static files + nginx.
FROM nginx:alpine

# Copy the built files from Stage 1 into nginx's web root.
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing fix: React handles its own routes client-side.
# Without this, refreshing /dashboard gives nginx a 404 (file doesn't exist).
# This config tells nginx to always serve index.html and let React handle routing.
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
