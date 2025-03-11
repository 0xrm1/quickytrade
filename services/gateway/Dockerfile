FROM node:16-alpine

WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm ci --only=production

# Uygulama kodunu kopyala
COPY . .

# Ortam değişkenlerini ayarla
ENV NODE_ENV=production
ENV PORT=5000

# Portu aç
EXPOSE 5000

# Uygulamayı başlat
CMD ["node", "index.js"] 