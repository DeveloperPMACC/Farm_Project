FROM node:18-alpine

WORKDIR /app

# Instalar dependencias de sistema si es necesario
RUN apk update && apk add --no-cache bash postgresql-client

# Instalar dependencias de Node
COPY package*.json ./
RUN npm ci --only=production

# Copiar archivos del proyecto
COPY . .

# Configurar variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Script de inicio
CMD ["node", "app.js"]