#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando configuración del proyecto Farm...${NC}"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js no está instalado. Por favor, instálalo antes de continuar.${NC}"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm no está instalado. Por favor, instálalo antes de continuar.${NC}"
    exit 1
fi

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL no está instalado. Por favor, instálalo antes de continuar.${NC}"
    exit 1
fi

# Instalar dependencias
echo -e "${YELLOW}Instalando dependencias...${NC}"
npm install

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creando archivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}Archivo .env creado. Por favor, edítalo con tus configuraciones.${NC}"
fi

# Crear base de datos y ejecutar migraciones
echo -e "${YELLOW}Configurando base de datos...${NC}"
npm run db:create
npm run db:migrate
npm run db:seed

# Comprobar si hay permisos para ADB
ADB_PATH=$(grep ADB_PATH .env | cut -d '=' -f2)
if [ -n "$ADB_PATH" ] && [ -f "$ADB_PATH" ]; then
    if ! [ -x "$ADB_PATH" ]; then
        echo -e "${YELLOW}Configurando permisos para ADB...${NC}"
        chmod +x "$ADB_PATH"
    fi
else
    echo -e "${YELLOW}Aviso: La ruta a ADB no está configurada o no existe. Asegúrate de configurar ADB_PATH en el archivo .env${NC}"
fi

# Crear directorio de logs si no existe
mkdir -p logs

echo -e "${GREEN}¡Configuración completada! Puedes iniciar el servidor con npm start o ./start.sh${NC}"