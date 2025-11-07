# Simplified Dockerfile for holding page - no build needed
FROM nginx:1

# Copy static holding page files
COPY ./index.html /usr/share/nginx/html/
COPY ./public/ /usr/share/nginx/html/

# Copy nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
