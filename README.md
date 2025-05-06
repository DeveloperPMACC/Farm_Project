# View Farm

Un sistema completo para automatizar la interacción con aplicaciones móviles utilizando Raspberry Pi y Node.js. Diseñado para generar vistas, likes y mejorar el posicionamiento de marca de forma automatizada.

## Características

- ✅ Gestión automatizada de dispositivos Android
- ✅ Control centralizado a través de dashboard web
- ✅ Programación de tareas con prioridades
- ✅ Simulación de comportamiento humano para evitar detección
- ✅ Estadísticas y reportes de rendimiento
- ✅ APIs RESTful para integración con otros sistemas
- ✅ Soporte para múltiples aplicaciones populares
- ✅ Monitoreo en tiempo real con Socket.IO
- ✅ Compatibilidad con Docker para fácil despliegue

## Requisitos

- Raspberry Pi 3 o superior
- Sistema operativo: Raspberry Pi OS (Debian Buster o superior)
- Dispositivos Android con USB Debugging habilitado
- Conexión a Internet

## Aplicaciones soportadas

- YouTube
- Instagram
- TikTok
- Snapchat
- (Posibilidad de añadir soporte para más aplicaciones)

## Instalación

### Método 1: Instalación manual

1. Clona este repositorio:
   ```bash
   git clone https://github.com/username/farm-project.git
   cd farm-project
   ```

2. Ejecuta el script de configuración:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. Inicia el servicio:
   ```bash
   ./start.sh
   ```

### Método 2: Instalación con Docker

1. Clona este repositorio:
   ```bash
   git clone https://github.com/username/farm-project.git
   cd farm-project
   ```

2. Ejecuta Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Configuración

El archivo de configuración principal se encuentra en `config.js`. Puedes modificar parámetros como:

- Aplicaciones soportadas
- Tiempos de visualización
- Probabilidades de interacción
- Rotación de dispositivos
- Ajustes anti-detección

Además, puedes utilizar variables de entorno o un archivo `.env` para configurar:

```
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/farm_project
ADB_PATH=adb
LOG_LEVEL=info
```

## Uso

### Dashboard Web

Accede al dashboard web en:

```
http://[IP-RASPBERRY-PI]:3000
```

Desde el dashboard podrás:
- Administrar dispositivos conectados
- Crear y programar tareas
- Ver estadísticas en tiempo real
- Monitorear logs de actividad

### API REST

La aplicación expone una API REST para integración con otros sistemas:

- `GET /api/devices` - Listar dispositivos
- `GET /api/tasks` - Listar tareas
- `POST /api/tasks/add` - Crear nueva tarea
- `GET /api/stats/summary` - Obtener estadísticas

Consulta la documentación completa de la API en `/api/docs`.

## Conexión de dispositivos

1. Habilita el Modo Desarrollador en tu dispositivo Android
2. Activa la Depuración USB
3. Conecta el dispositivo al Raspberry Pi mediante USB
4. Acepta la solicitud de depuración en el dispositivo Android
5. Verifica que el dispositivo aparece en el dashboard

## Gestión de tareas

Para crear una nueva tarea desde el dashboard:

1. Haz clic en "Nueva Tarea"
2. Selecciona la aplicación destino
3. Introduce URLs o palabras clave separadas por comas
4. Establece la prioridad de la tarea
5. Haz clic en "Guardar"

## Consejos para evitar detección

- Utiliza largos períodos de interacción
- Habilita "Emulación de comportamiento humano" en la configuración
- Evita grandes volúmenes de tareas en cortos períodos de tiempo
- Rota los dispositivos para evitar sobrecalentamiento
- Usa distintas cuentas en cada dispositivo

## Mantenimiento

### Logs

Los logs de la aplicación se almacenan en el directorio `logs/`:

- `farm_project.log` - Log principal
- `error.log` - Solo errores

### Actualización

Para actualizar el sistema:

```bash
git pull
npm install
./restart.sh
```

### Respaldo de datos

Para respaldar la base de datos:

```bash
mongodump --db farm_project --out backup/
```

## Solución de problemas

### Dispositivos no detectados

- Verifica que la depuración USB esté habilitada
- Comprueba los cables USB
- Ejecuta `adb devices` para verificar la conexión
- Reinicia el servicio ADB: `adb kill-server && adb start-server`

### Fallos en tareas

- Verifica la conectividad a Internet
- Comprueba que las aplicaciones están instaladas y actualizadas
- Revisa los logs en busca de errores específicos
- Ajusta los tiempos de espera en la configuración

## Estructura del proyecto

```
farm_project/
├── app.js                 # Punto de entrada de la aplicación
├── config.js              # Configuración principal
├── docker-compose.yml     # Configuración de Docker
├── Dockerfile             # Definición de imagen Docker
├── package.json           # Dependencias de Node.js
├── config/                # Archivos de configuración adicionales
├── logs/                  # Directorio de logs
├── public/                # Archivos estáticos para el front-end
│   ├── css/               # Hojas de estilo
│   ├── js/                # Scripts del lado del cliente
│   └── img/               # Imágenes
├── src/                   # Código fuente
│   ├── controllers/       # Controladores de la aplicación
│   ├── models/            # Modelos de datos (Mongoose)
│   ├── routes/            # Definiciones de rutas
│   └── utils/             # Utilidades y helpers
└── views/                 # Plantillas EJS
```

## Licencia

Este proyecto está licenciado bajo [TIPO DE LICENCIA] - consulte el archivo LICENSE para más detalles.

## Descargo de responsabilidad

Esta herramienta está destinada únicamente a fines educativos y de marketing legítimo. El uso indebido puede violar los términos de servicio de las aplicaciones. El desarrollador no se hace responsable del mal uso de este software.
