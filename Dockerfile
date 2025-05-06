FROM node:18-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    android-tools-adb \
    android-tools-fastboot \
    usbutils \
    wget \
    gnupg \
    curl \
    procps \
    ca-certificates \
    libusb-1.0-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de la aplicación
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node
RUN npm install

# Copiar el resto de los archivos
COPY . .

# Crear directorio para logs
RUN mkdir -p logs

# Exponer puerto
EXPOSE 3000

# Crear script de arranque
RUN echo '#!/bin/bash\n\
# Iniciar servidor ADB\n\
adb start-server\n\
\n\
# Iniciar aplicación Node.js\n\
node app.js\n\
' > /app/docker-entrypoint.sh \
&& chmod +x /app/docker-entrypoint.sh

# Definir comando de inicio
CMD ["/app/docker-entrypoint.sh"]
