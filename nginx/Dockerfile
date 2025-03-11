FROM nginx:1.25-alpine

# Install required packages
RUN apk add --no-cache openssl

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Copy SSL certificates
COPY ssl/quickytrade.crt /etc/nginx/ssl/
COPY ssl/quickytrade.key /etc/nginx/ssl/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directory for static files
RUN mkdir -p /usr/share/nginx/html

# Copy default error pages
COPY error-pages/* /usr/share/nginx/html/

# Expose ports
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 