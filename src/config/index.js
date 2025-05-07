require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'farm_project',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1d',
  },
  adb: {
    path: process.env.ADB_PATH || 'adb',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  deviceSettings: {
    viewingTimes: {
      min: 30,
      max: 120,
    },
    interactionProbability: 0.3,
    rotationInterval: 60,
  },
  apps: [
    { name: 'youtube', packageName: 'com.google.android.youtube' },
    { name: 'tiktok', packageName: 'com.zhiliaoapp.musically' },
    { name: 'snapchat', packageName: 'com.snapchat.android' },
  ],
};