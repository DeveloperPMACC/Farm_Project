// src/utils/actionExecutor.js
const config = require('../../config');
const logger = require('./logger');
const deviceManager = require('./deviceManager');
const TaskModel = require('../models/task');
const ActivityLogModel = require('../models/activityLog');
const { randomInt, randomElement } = require('./helpers');

class ActionExecutor {
  constructor() {
    this.isRunning = false;
    this.currentTasks = new Map();
  }

  /**
   * Inicializa el ejecutor de acciones
   */
  async initialize() {
    logger.info('Inicializando ejecutor de acciones');
    this.isRunning = true;
    this.startTaskProcessing();
    logger.info('Ejecutor de acciones inicializado correctamente');
  }

  /**
   * Inicia el procesamiento continuo de tareas
   */
  async startTaskProcessing() {
    logger.info('Iniciando procesamiento de tareas');
    
    // Función recursiva para procesar tareas continuamente
    const processLoop = async () => {
      if (!this.isRunning) return;
      
      try {
        // Obtener y procesar el siguiente lote de tareas
        const processed = await this.processNextBatch();
        
        // Si no se procesaron tareas, esperar más tiempo
        const waitTime = processed ? config.tasks.pollInterval : config.tasks.pollInterval * 3;
        
        // Programar la próxima ejecución
        setTimeout(processLoop, waitTime);
      } catch (error) {
        logger.error(`Error en el bucle de procesamiento: ${error.message}`);
        setTimeout(processLoop, config.tasks.pollInterval * 5); // Esperar más en caso de error
      }
    };
    
    // Iniciar el bucle
    processLoop();
  }

  /**
   * Procesa el siguiente lote de tareas pendientes
   */
  async processNextBatch() {
    if (this.currentTasks.size >= config.advanced.maxConcurrentTasks) {
      logger.debug(`Máximo de tareas concurrentes alcanzado (${this.currentTasks.size})`);
      return false;
    }
    
    try {
      // Obtener dispositivos disponibles
      const availableDeviceId = await deviceManager.getAvailableDevice();
      
      if (!availableDeviceId) {
        logger.debug('No hay dispositivos disponibles para procesar tareas');
        return false;
      }
      
      // Obtener tareas pendientes
      const pendingTasks = await TaskModel.find({
        status: 'pending',
        failedAttempts: { $lt: config.tasks.maxFailedAttempts }
      })
        .sort({ priority: -1, createdAt: 1 })
        .limit(config.tasks.batchSize);
      
      if (!pendingTasks.length) {
        logger.debug('No hay tareas pendientes para procesar');
        return false;
      }
      
      // Procesar la primera tarea con el dispositivo disponible
      const task = pendingTasks[0];
      
      logger.info(`Procesando tarea ${task._id} en dispositivo ${availableDeviceId}`);
      
      // Actualizar estado del dispositivo
      await deviceManager.updateDeviceStatus(availableDeviceId, 'busy', task._id);
      
      // Actualizar estado de la tarea
      task.status = 'running';
      task.deviceId = availableDeviceId;
      task.startTime = new Date();
      await task.save();
      
      // Registrar en mapa de tareas actuales
      this.currentTasks.set(task._id.toString(), {
        taskId: task._id,
        deviceId: availableDeviceId,
        appPackage: task.appPackage,
        startTime: new Date()
      });
      
      // Registrar actividad
      await this.logActivity(availableDeviceId, 'start_task', 'success', task._id);
      
      // Ejecutar la tarea en un proceso separado
      this.executeTask(task, availableDeviceId)
        .catch(error => logger.error(`Error al ejecutar tarea ${task._id}: ${error.message}`));
      
      return true;
    } catch (error) {
      logger.error(`Error al procesar lote de tareas: ${error.message}`);
      return false;
    }
  }

  /**
   * Ejecuta una tarea específica en un dispositivo
   */
  async executeTask(task, deviceId) {
    try {
      logger.info(`Iniciando ejecución de tarea ${task._id} en dispositivo ${deviceId}`);
      
      // Obtener app específica de la configuración
      const app = config.apps.supported.find(a => a.packageName === task.appPackage);
      
      if (!app) {
        throw new Error(`Aplicación ${task.appPackage} no soportada`);
      }
      
      // 1. Desbloquear pantalla
      const unlocked = await deviceManager.unlockScreen(deviceId);
      if (!unlocked) {
        throw new Error('No se pudo desbloquear la pantalla');
      }
      await this.logActivity(deviceId, 'unlock_screen', 'success', task._id);
      
      // 2. Iniciar la aplicación
      await deviceManager.executeShellCommand(
        deviceId,
        `am start -n ${task.appPackage}/${app.mainActivity}`
      );
      await this.sleep(5000); // Esperar a que la app se inicie
      await this.logActivity(deviceId, 'start_app', 'success', task._id);
      
      // 3. Realizar búsqueda si hay keywords
      if (task.videoUrls && task.videoUrls.length > 0) {
        // Simular comportamiento humano antes de buscar
        await this.simulateHumanBehavior(deviceId);
        
        // Buscar el contenido específico (adaptado a cada aplicación)
        await this.performSearch(deviceId, app, task.videoUrls[0]);
        await this.logActivity(deviceId, 'search_content', 'success', task._id);
        
        // Simular comportamiento humano antes de interactuar
        await this.simulateHumanBehavior(deviceId);
        
        // 4. Ver el contenido por un tiempo aleatorio
        const viewTime = randomInt(
          config.actions.viewTimeMin * 1000,
          config.actions.viewTimeMax * 1000
        );
        logger.info(`Viendo contenido por ${viewTime/1000} segundos en dispositivo ${deviceId}`);
        await this.sleep(viewTime);
        await this.logActivity(deviceId, 'view_content', 'success', task._id);
        
        // 5. Realizar interacciones según probabilidades configuradas
        await this.performInteractions(deviceId, app, task._id);
      }
      
      // 6. Registrar captura de pantalla para verificación (opcional)
      if (config.advanced.captureScreenshots) {
        await deviceManager.takeScreenshot(deviceId);
        await this.logActivity(deviceId, 'take_screenshot', 'success', task._id);
      }
      
      // 7. Regresar a la pantalla de inicio
      await deviceManager.executeShellCommand(
        deviceId,
        'input keyevent KEYCODE_HOME'
      );
      await this.logActivity(deviceId, 'return_home', 'success', task._id);
      
      // 8. Finalizar la tarea exitosamente
      await this.completeTask(task._id, deviceId, true);
      
      logger.info(`Tarea ${task._id} completada exitosamente en dispositivo ${deviceId}`);
      return true;
    } catch (error) {
      logger.error(`Error ejecutando tarea ${task._id} en dispositivo ${deviceId}: ${error.message}`);
      
      // Capturar pantalla en caso de error para diagnóstico
      try {
        await deviceManager.takeScreenshot(deviceId);
      } catch (screenshotError) {
        logger.error(`No se pudo tomar captura de error: ${screenshotError.message}`);
      }
      
      // Regresar a la pantalla de inicio en caso de error
      try {
        await deviceManager.executeShellCommand(deviceId, 'input keyevent KEYCODE_HOME');
      } catch (homeError) {
        logger.error(`No se pudo volver a la pantalla de inicio: ${homeError.message}`);
      }
      
      // Finalizar la tarea con error
      await this.completeTask(task._id, deviceId, false, error.message);
      return false;
    }
  }

  /**
   * Realiza una búsqueda en la aplicación según el tipo de app
   */
  async performSearch(deviceId, app, searchTerm) {
    logger.debug(`Realizando búsqueda "${searchTerm}" en ${app.appName}`);
    
    try {
      switch (app.packageName) {
        case 'com.google.android.youtube':
          // Tocar en el icono de búsqueda
          await deviceManager.executeShellCommand(
            deviceId,
            'input tap 880 120'
          );
          await this.sleep(1000);
          
          // Escribir en el campo de búsqueda
          await deviceManager.executeShellCommand(
            deviceId,
            `input text "${searchTerm.replace(/\s/g, '%s')}"`
          );
          await this.sleep(1000);
          
          // Presionar enter/buscar
          await deviceManager.executeShellCommand(
            deviceId,
            'input keyevent 66'
          );
          await this.sleep(3000);
          
          // Tocar el primer resultado
          await deviceManager.executeShellCommand(
            deviceId,
            'input tap 500 300'
          );
          break;
          
        case 'com.instagram.android':
          // Tocar en la barra de búsqueda
          await deviceManager.executeShellCommand(
            deviceId,
            'input tap 500 120'
          );
          await this.sleep(1000);
          
          // Escribir en el campo de búsqueda
          await deviceManager.executeShellCommand(
            deviceId,
            `input text "${searchTerm.replace(/\s/g, '%s')}"`
          );
          await this.sleep(1500);
          
          // Seleccionar un resultado
          await deviceManager.executeShellCommand(
            deviceId,
            'input tap 500 300'
          );
          break;
          
        case 'com.zhiliaoapp.musically': // TikTok
          // Ir a la pestaña de descubrir
          await deviceManager.executeShellCommand(
            deviceId,
            'input tap 500 1200'
          );
          await this.sleep(1000);
          
          // Tocar en la barra de búsqueda
          await deviceManager.executeShellCommand(
            deviceId,
            'input tap 500 100'
          );
          await this.sleep(1000);
          
          // Escribir en el campo de búsqueda
          await deviceManager.executeShellCommand(
            deviceId,
            `input text "${searchTerm.replace(/\s/g, '%s')}"`
          );
          await this.sleep(1500);
          
          // Presionar buscar
          await deviceManager.executeShellCommand(
            deviceId,
            'input keyevent 66'
          );
          await this.sleep(2000);
          
          // Tocar primer resultado
          await deviceManager.executeShellCommand(
            deviceId,
            'input tap 500 300'
          );
          break;
          
        default:
          // Para otras apps, intentar un enfoque genérico
          // Tocar en área típica de búsqueda
          await deviceManager.executeShellCommand(
            deviceId,
            `input tap ${app.actions.searchBox ? app.actions.searchBox.x : 500} ${app.actions.searchBox ? app.actions.searchBox.y : 100}`
          );
          await this.sleep(1000);
          
          // Escribir término de búsqueda
          await deviceManager.executeShellCommand(
            deviceId,
            `input text "${searchTerm.replace(/\s/g, '%s')}"`
          );
          await this.sleep(1000);
          
          // Presionar enter
          await deviceManager.executeShellCommand(
            deviceId,
            'input keyevent 66'
          );
          await this.sleep(2000);
      }
      
      logger.debug(`Búsqueda completada en ${app.appName}`);
      return true;
    } catch (error) {
      logger.error(`Error al realizar búsqueda en ${app.appName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Realiza interacciones con el contenido según probabilidades configuradas
   */
  async performInteractions(deviceId, app, taskId) {
    // Interacción: Like
    if (Math.random() < config.actions.likeProbability) {
      try {
        // Tocar en el botón de like según la app
        await deviceManager.executeShellCommand(
          deviceId,
          `input tap ${app.actions.like.x} ${app.actions.like.y}`
        );
        await this.sleep(1000);
        
        await this.logActivity(deviceId, 'like', 'success', taskId);
        logger.info(`Like realizado en dispositivo ${deviceId}`);
      } catch (error) {
        logger.error(`Error al dar like: ${error.message}`);
      }
    }
    
    // Interacción: Comentar
    if (Math.random() < config.actions.commentProbability) {
      try {
        // Seleccionar un comentario aleatorio de las plantillas
        const comment = randomElement(config.actions.commentTemplates);
        
        // Tocar en área de comentarios (varía según app)
        if (app.actions.comment) {
          await deviceManager.executeShellCommand(
            deviceId,
            `input tap ${app.actions.comment.x} ${app.actions.comment.y}`
          );
          await this.sleep(1500);
          
          // Escribir comentario
          await deviceManager.executeShellCommand(
            deviceId,
            `input text "${comment.replace(/\s/g, '%s')}"`
          );
          await this.sleep(1000);
          
          // Enviar comentario (generalmente botón enviar)
          await deviceManager.executeShellCommand(
            deviceId,
            'input tap 950 1200'
          );
          
          await this.logActivity(deviceId, 'comment', 'success', taskId);
          logger.info(`Comentario realizado en dispositivo ${deviceId}`);
        }
      } catch (error) {
        logger.error(`Error al comentar: ${error.message}`);
      }
    }
    
    // Interacción: Seguir/Suscribirse
    if (Math.random() < 0.3 && app.actions.subscribe) { // Probabilidad más baja
      try {
        // Tocar en botón de seguir/suscribirse
        await deviceManager.executeShellCommand(
          deviceId,
          `input tap ${app.actions.subscribe.x} ${app.actions.subscribe.y}`
        );
        
        await this.logActivity(deviceId, 'subscribe', 'success', taskId);
        logger.info(`Suscripción realizada en dispositivo ${deviceId}`);
      } catch (error) {
        logger.error(`Error al suscribirse: ${error.message}`);
      }
    }
  }

  /**
   * Simula comportamiento humano aleatorio para evitar detección
   */
  async simulateHumanBehavior(deviceId) {
    logger.debug(`Simulando comportamiento humano en dispositivo ${deviceId}`);
    
    // Seleccionar un patrón aleatorio de interacción
    const pattern = randomElement(config.actions.interactionPatterns);
    
    try {
      switch (pattern.action) {
        case 'scroll':
          // Realizar scrolls aleatorios
          for (let i = 0; i < pattern.count; i++) {
            const startY = randomInt(800, 1000);
            const endY = randomInt(300, 500);
            const duration = randomInt(200, 500);
            
            await deviceManager.executeShellCommand(
              deviceId,
              `input swipe 500 ${startY} 500 ${endY} ${duration}`
            );
            
            // Esperar un tiempo aleatorio entre scrolls
            await this.sleep(randomInt(1000, 3000));
          }
          break;
          
        case 'pause':
          // Simplemente esperar
          await this.sleep(pattern.time);
          break;
          
        case 'tap':
          // Tocar en un punto aleatorio cerca del especificado
          const x = pattern.x + randomInt(-50, 50);
          const y = pattern.y + randomInt(-50, 50);
          
          await deviceManager.executeShellCommand(
            deviceId,
            `input tap ${x} ${y}`
          );
          
          await this.sleep(randomInt(1000, 2000));
          break;
      }
      
      logger.debug(`Comportamiento humano simulado completado`);
    } catch (error) {
      logger.error(`Error al simular comportamiento humano: ${error.message}`);
    }
  }

  /**
   * Completa una tarea (éxito o fracaso)
   */
  async completeTask(taskId, deviceId, success, errorMessage = null) {
    try {
      // Eliminar de mapa de tareas actuales
      this.currentTasks.delete(taskId.toString());
      
      // Actualizar tarea en BD
      const task = await TaskModel.findById(taskId);
      
      if (!task) {
        throw new Error(`Tarea ${taskId} no encontrada`);
      }
      
      if (success) {
        task.status = 'completed';
        task.completedAt = new Date();
        task.result = 'success';
      } else {
        task.status = 'failed';
        task.failedAttempts = (task.failedAttempts || 0) + 1;
        task.lastError = errorMessage || 'Error desconocido';
        
        // Si se alcanzó el máximo de intentos fallidos, marcar como fallada definitivamente
        if (task.failedAttempts >= config.tasks.maxFailedAttempts) {
          task.status = 'failed_permanently';
        } else {
          // De lo contrario, marcar como pendiente para reintento
          task.status = 'pending';
        }
      }
      
      await task.save();
      
      // Actualizar estado del dispositivo
      await deviceManager.updateDeviceStatus(deviceId, 'idle');
      
      // Registrar actividad
      await this.logActivity(
        deviceId, 
        'complete_task', 
        success ? 'success' : 'failed',
        taskId
      );
      
      logger.info(`Tarea ${taskId} marcada como ${task.status}`);
      return true;
    } catch (error) {
      logger.error(`Error al completar tarea ${taskId}: ${error.message}`);
      
      // Intento de emergencia para liberar el dispositivo
      try {
        await deviceManager.updateDeviceStatus(deviceId, 'idle');
      } catch (deviceError) {
        logger.error(`No se pudo actualizar estado del dispositivo: ${deviceError.message}`);
      }
      
      return false;
    }
  }

  /**
   * Registra actividad en los logs
   */
  async logActivity(deviceId, action, status, taskId = null) {
    try {
      const log = new ActivityLogModel({
        deviceId,
        action,
        status,
        taskId,
        timestamp: new Date()
      });
      
      await log.save();
      return true;
    } catch (error) {
      logger.error(`Error al registrar actividad: ${error.message}`);
      return false;
    }
  }

  /**
   * Utilidad para esperar
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Añade una nueva tarea
   */
  async addTask(appPackage, videoUrls, priority = config.tasks.defaultPriority) {
    try {
      // Verificar que la app está soportada
      const supportedApps = config.apps.supported.map(app => app.packageName);
      
      if (!supportedApps.includes(appPackage)) {
        throw new Error(`Aplicación ${appPackage} no soportada`);
      }
      
      // Crear nueva tarea
      const task = new TaskModel({
        appPackage,
        videoUrls: Array.isArray(videoUrls) ? videoUrls : [videoUrls],
        priority,
        status: 'pending',
        createdAt: new Date()
      });
      
      await task.save();
      logger.info(`Nueva tarea creada con ID: ${task._id}`);
      
      return task;
    } catch (error) {
      logger.error(`Error al crear tarea: ${error.message}`);
      throw error;
    }
  }
}

// Exportar una instancia singleton
const actionExecutor = new ActionExecutor();
module.exports = actionExecutor;
