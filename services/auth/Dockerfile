FROM node:16-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Sadece production bağımlılıklarını yükle
RUN npm ci --only=production

# Uygulama kodunu kopyala
COPY . .

# Ortam değişkenlerini ayarla
ENV NODE_ENV=production
ENV AUTH_PORT=5002

# Portu dışa aç
EXPOSE 5002

# Uygulamayı başlat
CMD ["node", "src/index.js"] 