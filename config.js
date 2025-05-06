// config.js
require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },

  database: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'farm_project',
    logging: process.env.NODE_ENV === 'development',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  adb: {
    path: process.env.ADB_PATH || 'adb', // ruta al ejecutable ADB
    deviceRefreshInterval: 60000, // 60 segundos
    connectionTimeout: 30000 // 30 segundos
  },

  apps: {
    default: 'com.android.vending',
    supported: [
      {
        packageName: 'com.google.android.youtube',
        appName: 'YouTube',
        mainActivity: 'com.google.android.youtube.HomeActivity',
        actions: {
          // Coordenadas aproximadas para acciones comunes (ajustar según el dispositivo)
          like: { x: 500, y: 1200 },
          subscribe: { x: 600, y: 1250 },
          comment: { x: 400, y: 1300 },
          searchBox: { x: 300, y: 200 }
        }
      },
      {
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        mainActivity: 'com.instagram.mainactivity.MainActivity',
        actions: {
          like: { x: 500, y: 1200 },
          follow: { x: 600, y: 400 },
          comment: { x: 400, y: 1300 }
        }
      },
      {
        packageName: 'com.zhiliaoapp.musically',
        appName: 'TikTok',
        mainActivity: 'com.ss.android.ugc.aweme.main.MainActivity',
        actions: {
          like: { x: 700, y: 650 },
          follow: { x: 700, y: 550 },
          comment: { x: 700, y: 750 }
        }
      },
      {
        packageName: 'com.snapchat.android',
        appName: 'Snapchat',
        mainActivity: 'com.snapchat.android.LandingPageActivity',
        actions: {
          like: { x: 500, y: 1200 },
          subscribe: { x: 600, y: 400 }
        }
      }
    ]
  },

  tasks: {
    defaultPriority: 5,
    maxFailedAttempts: 3,
    batchSize: 5, // Procesar tareas en lotes
    pollInterval: 5000 // 5 segundos entre verificación de tareas
  },

  actions: {
    viewTimeMin: 30, // segundos mínimos de visualización
    viewTimeMax: 120, // segundos máximos de visualización
    likeProbability: 0.5, // probabilidad de dar like
    commentProbability: 0.2, // probabilidad de comentar
    commentTemplates: [
      "¡Genial! 👍",
      "Me encanta este contenido",
      "Muy interesante",
      "Increíble trabajo",
      "Gracias por compartir",
      "Impresionante 🔥",
      "Excelente contenido 👏",
      "Siempre aprendo algo nuevo"
    ],
    // Patrones de interacción naturales para evitar detección
    interactionPatterns: [
      { action: 'scroll', count: 3, interval: 2000 },
      { action: 'pause', time: 5000 },
      { action: 'scroll', count: 2, interval: 3000 },
      { action: 'tap', x: 500, y: 500 }
    ]
  },

  proxy: {
    enabled: false,
    list: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : [],
    rotationInterval: 3600000 // 1 hora
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: 'logs/farm_project.log',
    maxSize: 10485760, // 10MB
    maxFiles: 5
  },

  advanced: {
    useAntiDetection: true,
    randomizeUserAgent: true,
    emulateHumanBehavior: true,
    maxConcurrentTasks: 10,
    deviceHealthCheckInterval: 300000, // 5 minutos
    enableErrorRecovery: true,
    deviceRotation: true // alternar dispositivos para evitar sobrecalentamiento
  }
};
