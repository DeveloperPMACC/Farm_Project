#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando el servidor Farm Project...${NC}"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js no está instalado. Por favor, instálalo antes de continuar.${NC}"
    exit 1
fi

# Verificar si el archivo .env existe
if [ ! -f .env ]; then
    echo -e "${RED}El archivo .env no existe. Por favor, ejecuta ./setup.sh primero.${NC}"
    exit 1
fi

# Iniciar el servidor según el entorno
NODE_ENV=$(grep NODE_ENV .env | cut -d '=' -f2)

if [ "$NODE_ENV" = "production" ]; then
    echo -e "${YELLOW}Iniciando en modo producción...${NC}"
    node app.js
else
    echo -e "${YELLOW}Iniciando en modo desarrollo con nodemon...${NC}"
    if command -v npx &> /dev/null; then
        npx nodemon app.js
    else
        node_modules/.bin/nodemon app.js
    fi
fi