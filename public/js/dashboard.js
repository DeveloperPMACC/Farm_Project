// public/js/dashboard.js
$(document).ready(function() {
  // Conectar Socket.io
  const socket = io();
  
  // Variables globales
  let refreshInterval = 5000; // 5 segundos por defecto
  let refreshTimer;
  
  // Inicializar
  init();
  
  // Función de inicialización
  function init() {
    // Cargar datos iniciales
    loadDashboardData();
    
    // Iniciar actualizaciones periódicas
    startAutoRefresh();
    
    // Event listeners
    setupEventListeners();
    
    // Socket.io event listeners
    setupSocketListeners();
  }
  
  // Configurar event listeners
  function setupEventListeners() {
    // Botón de refresh manual
    $('#refreshButton').on('click', function() {
      loadDashboardData();
    });
    
    // Rango de prioridad
    $('#priority').on('input', function() {
      $('#priorityValue').text($(this).val());
    });
    
    // Guardar nueva tarea
    $('#saveTaskBtn').on('click', function() {
      saveNewTask();
    });
    
    // Guardar configuración
    $('#saveSettingsBtn').on('click', function() {
      saveSettings();
    });
    
    // Escanear dispositivos
    $('#scanDevicesBtn').on('click', function() {
      scanDevices();
    });
  }
  
  // Configurar Socket.io listeners
  function setupSocketListeners() {
    // Actualización de dispositivo
    socket.on('deviceUpdate', function(data) {
      console.log('Device update:', data);
      // Recargar lista de dispositivos para reflejar cambios
      loadDevices();
      
      // Actualizar contador de dispositivos
      if (data.type === 'added' || data.type === 'removed') {
        updateDeviceCount();
      }
      
      // Mostrar notificación
      showNotification(`Dispositivo ${data.device.deviceId} ${data.type === 'added' ? 'conectado' : 'actualizado'}`);
    });
    
    // Actualización de tarea
    socket.on('taskUpdate', function(data) {
      console.log('Task update:', data);
      // Recargar lista de tareas para reflejar cambios
      loadTasks();
      
      // Actualizar contadores
      if (data.type === 'added' || data.type === 'completed' || data.type === 'failed') {
        updateTaskCounters();
      }
      
      // Mostrar notificación
      if (data.type === 'completed') {
        showNotification(`Tarea ${data.task._id} completada`);
      }
    });
    
    // Configuración desde servidor
    socket.on('config', function(data) {
      console.log('Config received:', data);
      // Actualizar elementos de UI con la configuración
      updateConfigUI(data);
    });
  }
  
  // Cargar todos los datos del dashboard
  function loadDashboardData() {
    updateDeviceCount();
    updateTaskCounters();
    loadDevices();
    loadTasks();
    loadLogs();
    loadStatsSummary();
  }
  
  // Iniciar actualización automática
  function startAutoRefresh() {
    // Limpiar timer existente si hay
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    
    // Iniciar nuevo timer
    refreshTimer = setInterval(function() {
      loadDashboardData();
    }, refreshInterval);
    
    console.log(`Auto-refresh iniciado, intervalo: ${refreshInterval}ms`);
  }
  
  // Actualizar contador de dispositivos
  function updateDeviceCount() {
    $.ajax({
      url: '/api/devices',
      method: 'GET',
      success: function(data) {
        const activeDevices = data.filter(d => d.isActive).length;
        $('#deviceCount').text(activeDevices);
      },
      error: function(err) {
        console.error('Error al obtener contador de dispositivos:', err);
      }
    });
  }
  
  // Actualizar contadores de tareas
  function updateTaskCounters() {
    $.ajax({
      url: '/api/stats/summary',
      method: 'GET',
      success: function(data) {
        // Actualizar contadores
        $('#completedCount').text(data.today.completed);
        $('#pendingCount').text(data.total.pending);
        $('#successRate').text(`${data.total.successRate}%`);
      },
      error: function(err) {
        console.error('Error al obtener contadores de tareas:', err);
      }
    });
  }
  
  // Cargar lista de dispositivos
  function loadDevices() {
    $.ajax({
      url: '/api/devices',
      method: 'GET',
      success: function(devices) {
        // Limpiar tabla
        $('#devicesList').empty();
        
        if (devices.length === 0) {
          $('#devicesList').html('<tr><td colspan="5" class="text-center">No hay dispositivos conectados</td></tr>');
          return;
        }
        
        // Llenar tabla
        devices.forEach(function(device) {
          let statusBadge = '';
          
          switch(device.status) {
            case 'idle':
              statusBadge = '<span class="badge bg-success">Disponible</span>';
              break;
            case 'busy':
              statusBadge = '<span class="badge bg-warning text-dark">Ocupado</span>';
              break;
            case 'disconnected':
              statusBadge = '<span class="badge bg-danger">Desconectado</span>';
              break;
            case 'error':
              statusBadge = '<span class="badge bg-danger">Error</span>';
              break;
            case 'battery_critical':
              statusBadge = '<span class="badge bg-danger">Batería Crítica</span>';
              break;
            default:
              statusBadge = `<span class="badge bg-secondary">${device.status}</span>`;
          }
          
          // Crear icono de batería
          let batteryIcon = '';
          const batteryLevel = device.batteryLevel || 0;
          
          if (batteryLevel > 75) {
            batteryIcon = '<i class="fas fa-battery-full text-success"></i>';
          } else if (batteryLevel > 50) {
            batteryIcon = '<i class="fas fa-battery-three-quarters text-success"></i>';
          } else if (batteryLevel > 25) {
            batteryIcon = '<i class="fas fa-battery-half text-warning"></i>';
          } else if (batteryLevel > 10) {
            batteryIcon = '<i class="fas fa-battery-quarter text-danger"></i>';
          } else {
            batteryIcon = '<i class="fas fa-battery-empty text-danger"></i>';
          }
          
          // Agregar fila a la tabla
          $('#devicesList').append(`
            <tr>
              <td>${device.deviceId}</td>
              <td>${device.model || 'Desconocido'}</td>
              <td>${statusBadge}</td>
              <td>${batteryIcon} ${batteryLevel}%</td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary device-action" data-action="unlock" data-device="${device.deviceId}">
                    <i class="fas fa-unlock-alt"></i>
                  </button>
                  <button class="btn btn-outline-info device-action" data-action="screenshot" data-device="${device.deviceId}">
                    <i class="fas fa-camera"></i>
                  </button>
                  <button class="btn btn-outline-warning device-action" data-action="home" data-device="${device.deviceId}">
                    <i class="fas fa-home"></i>
                  </button>
                </div>
              </td>
            </tr>
          `);
        });
        
        // Agregar event listeners a los botones de acción
        $('.device-action').on('click', function() {
          const action = $(this).data('action');
          const deviceId = $(this).data('device');
          performDeviceAction(deviceId, action);
        });
      },
      error: function(err) {
        console.error('Error al cargar dispositivos:', err);
        $('#devicesList').html('<tr><td colspan="5" class="text-center text-danger">Error al cargar dispositivos</td></tr>');
      }
    });
  }
  
  // Cargar lista de tareas
  function loadTasks() {
    $.ajax({
      url: '/api/tasks',
      method: 'GET',
      success: function(tasks) {
        // Limpiar tabla
        $('#tasksList').empty();
        
        if (tasks.length === 0) {
          $('#tasksList').html('<tr><td colspan="5" class="text-center">No hay tareas recientes</td></tr>');
          return;
        }
        
        // Llenar tabla
        tasks.forEach(function(task) {
          let statusBadge = '';
          
          switch(task.status) {
            case 'pending':
              statusBadge = '<span class="badge bg-warning text-dark">Pendiente</span>';
              break;
            case 'running':
              statusBadge = '<span class="badge bg-primary">En Ejecución</span>';
              break;
            case 'completed':
              statusBadge = '<span class="badge bg-success">Completada</span>';
              break;
            case 'failed':
              statusBadge = '<span class="badge bg-danger">Fallida</span>';
              break;
            case 'failed_permanently':
              statusBadge = '<span class="badge bg-danger">Fallida (Permanente)</span>';
              break;
            default:
              statusBadge = `<span class="badge bg-secondary">${task.status}</span>`;
          }
          
          // Obtener nombre de app legible
          const appPackage = task.appPackage;
          let appName = appPackage;
          
          if (appPackage === 'com.google.android.youtube') {
            appName = 'YouTube';
          } else if (appPackage === 'com.instagram.android') {
            appName = 'Instagram';
          } else if (appPackage === 'com.zhiliaoapp.musically') {
            appName = 'TikTok';
          } else if (appPackage === 'com.snapchat.android') {
            appName = 'Snapchat';
          }
          
          // Formatear fecha
          const createdAt = new Date(task.createdAt).toLocaleString();
          
          // Agregar fila a la tabla
          $('#tasksList').append(`
            <tr>
              <td>${task._id.substring(0, 8)}...</td>
              <td>${appName}</td>
              <td>${statusBadge}</td>
              <td>${createdAt}</td>
              <td>
                <div class="btn-group btn-group-sm">
                  ${task.status === 'failed' ? 
                    `<button class="btn btn-outline-primary task-action" data-action="retry" data-task="${task._id}">
                      <i class="fas fa-redo"></i>
                    </button>` : ''}
                  <button class="btn btn-outline-info task-action" data-action="view" data-task="${task._id}">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-danger task-action" data-action="delete" data-task="${task._id}">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `);
        });
        
        // Agregar event listeners a los botones de acción
        $('.task-action').on('click', function() {
          const action = $(this).data('action');
          const taskId = $(this).data('task');
          performTaskAction(taskId, action);
        });
      },
      error: function(err) {
        console.error('Error al cargar tareas:', err);
        $('#tasksList').html('<tr><td colspan="5" class="text-center text-danger">Error al cargar tareas</td></tr>');
      }
    });
  }
  
  // Cargar registros de actividad
  function loadLogs() {
    $.ajax({
      url: '/api/logs',
      method: 'GET',
      success: function(logs) {
        // Limpiar tabla
        $('#logsList').empty();
        
        if (logs.length === 0) {
          $('#logsList').html('<tr><td colspan="4" class="text-center">No hay registros de actividad</td></tr>');
          return;
        }
        
        // Llenar tabla
        logs.forEach(function(log) {
          let statusClass = '';
          
          switch(log.status) {
            case 'success':
              statusClass = 'text-success';
              break;
            case 'failed':
              statusClass = 'text-danger';
              break;
            default:
              statusClass = 'text-secondary';
          }
          
          // Formatear fecha
          const timestamp = new Date(log.timestamp).toLocaleString();
          
          // Agregar fila a la tabla
          $('#logsList').append(`
            <tr>
              <td>${timestamp}</td>
              <td>${log.deviceId}</td>
              <td>${log.action}</td>
              <td class="${statusClass}">${log.status}</td>
            </tr>
          `);
        });
      },
      error: function(err) {
        console.error('Error al cargar logs:', err);
        $('#logsList').html('<tr><td colspan="4" class="text-center text-danger">Error al cargar registros</td></tr>');
      }
    });
  }
  
// Cargar resumen de estadísticas 
function loadStatsSummary() { 
  $.ajax({ 
    url: '/api/stats/summary', 
    method: 'GET', 
    success: function(data) {
      console.log('Stats summary:', data);
      
      // Actualizar gráficos si existen
      if (data.today && data.total && data.topApps) {
        // Actualizar el contador de éxito si no está ya actualizado
        if (data.total.successRate) {
          $('#successRate').text(`${data.total.successRate}%`);
        }
        
        // Crear datos para gráfico de actividad diaria
        if ($('#activityChart').length > 0) {
          createActivityChart('activityChart', {
            labels: ['Completadas', 'Fallidas', 'Pendientes'],
            values: [data.today.completed, data.today.failed, data.total.pending]
          });
        }
        
        // Crear datos para gráfico de aplicaciones
        if ($('#appsChart').length > 0 && data.topApps.length > 0) {
          const appLabels = data.topApps.map(app => {
            // Convertir nombres de paquetes a nombres amigables
            const packageName = app._id;
            if (packageName === 'com.google.android.youtube') return 'YouTube';
            if (packageName === 'com.instagram.android') return 'Instagram';
            if (packageName === 'com.zhiliaoapp.musically') return 'TikTok';
            if (packageName === 'com.snapchat.android') return 'Snapchat';
            return packageName;
          });
          
          const appValues = data.topApps.map(app => app.count);
          
          createAppsChart('appsChart', {
            labels: appLabels,
            values: appValues
          });
        }
        
        // Actualizar estadísticas de dispositivos
        if (data.devices) {
          const deviceStatus = data.devices;
          
          // Ejemplo: Mostrar en algún elemento con id 'deviceStats'
          if ($('#deviceStats').length > 0) {
            $('#deviceStats').html(`
              <div class="row">
                <div class="col-md-4">
                  <div class="card bg-light">
                    <div class="card-body text-center">
                      <h5>Total</h5>
                      <h3>${deviceStatus.total || 0}</h3>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card bg-success text-white">
                    <div class="card-body text-center">
                      <h5>Activos</h5>
                      <h3>${deviceStatus.active || 0}</h3>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card bg-warning">
                    <div class="card-body text-center">
                      <h5>Desconectados</h5>
                      <h3>${deviceStatus.disconnected || 0}</h3>
                    </div>
                  </div>
                </div>
              </div>
            `);
          }
        }
        
        // Actualizar estado del sistema
        if (data.system) {
          const system = data.system;
          
          // Calcular uso de memoria en porcentaje
          const memoryUsedPercent = Math.round((system.memory.used / system.memory.total) * 100);
          
          // Ejemplo: Mostrar en algún elemento con id 'systemStatus'
          if ($('#systemStatus').length > 0) {
            $('#systemStatus').html(`
              <div class="card">
                <div class="card-header">
                  <h5>Estado del Sistema</h5>
                </div>
                <div class="card-body">
                  <p><strong>Tiempo de actividad:</strong> ${formatUptime(system.uptime)}</p>
                  <p><strong>Uso de memoria:</strong> ${memoryUsedPercent}%</p>
                  <p><strong>Carga del sistema:</strong> ${system.load[0].toFixed(2)}, ${system.load[1].toFixed(2)}, ${system.load[2].toFixed(2)}</p>
                </div>
              </div>
            `);
          }
        }
      }
    },
    error: function(err) {
      console.error('Error al cargar resumen de estadísticas:', err);
    }
  });
}

// Formatear tiempo de actividad
function formatUptime(seconds) {
  if (!seconds) return '0s';
  
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Función para cargar y actualizar estadísticas detalladas
function loadDetailedStats() {
  $.ajax({
    url: '/api/stats/detailed',
    method: 'GET',
    success: function(data) {
      console.log('Detailed stats:', data);
      
      // Si hay datos de estadísticas diarias
      if (data.dailyStats && data.dailyStats.length > 0 && $('#dailyStatsChart').length > 0) {
        // Extraer fechas y valores para el gráfico
        const dates = data.dailyStats.map(stat => {
          const date = new Date(stat.date);
          return date.toLocaleDateString();
        });
        
        const completedTasks = data.dailyStats.map(stat => stat.metrics.tasksCompleted);
        const failedTasks = data.dailyStats.map(stat => stat.metrics.tasksFailed);
        
        // Crear gráfico de líneas para estadísticas diarias
        const ctx = document.getElementById('dailyStatsChart').getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [
              {
                label: 'Tareas Completadas',
                data: completedTasks,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
              },
              {
                label: 'Tareas Fallidas',
                data: failedTasks,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
      
      // Si hay datos de rendimiento por dispositivo
      if (data.devicePerformance && data.devicePerformance.length > 0 && $('#devicePerformanceTable').length > 0) {
        const $table = $('#devicePerformanceTable tbody');
        $table.empty();
        
        data.devicePerformance.forEach(device => {
          const successRate = device.tasksCompleted > 0 ? 
            ((device.tasksCompleted / (device.tasksCompleted + device.tasksFailed)) * 100).toFixed(2) + '%' : 
            'N/A';
            
          $table.append(`
            <tr>
              <td>${device.deviceId}</td>
              <td>${device.model || 'Desconocido'}</td>
              <td>${device.tasksCompleted}</td>
              <td>${device.tasksFailed}</td>
              <td>${successRate}</td>
            </tr>
          `);
        });
      }
    },
    error: function(err) {
      console.error('Error al cargar estadísticas detalladas:', err);
    }
  });
}

// Función para cargar datos de rendimiento del sistema
function loadSystemPerformance() {
  $.ajax({
    url: '/api/system/performance',
    method: 'GET',
    success: function(data) {
      console.log('System performance:', data);
      
      // Actualizar medidores de rendimiento si existen
      if (data.cpu && $('#cpuGauge').length > 0) {
        updateGauge('cpuGauge', data.cpu.usage, {
          min: 0,
          max: 100,
          title: 'CPU',
          units: '%',
          thresholds: {
            60: 'warning',
            80: 'danger'
          }
        });
      }
      
      if (data.memory && $('#memoryGauge').length > 0) {
        updateGauge('memoryGauge', data.memory.usedPercent, {
          min: 0,
          max: 100,
          title: 'Memoria',
          units: '%',
          thresholds: {
            70: 'warning',
            90: 'danger'
          }
        });
      }
      
      if (data.network && $('#networkGraph').length > 0) {
        // Actualizar gráfico de red con datos históricos
        updateNetworkGraph('networkGraph', data.network);
      }
    },
    error: function(err) {
      console.error('Error al cargar rendimiento del sistema:', err);
    }
  });
}

// Función para actualizar un medidor de rendimiento
function updateGauge(elementId, value, options) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Determinar el color según los umbrales
  let color = 'success';
  if (options.thresholds) {
    const thresholds = Object.keys(options.thresholds).map(Number).sort((a, b) => a - b);
    for (const threshold of thresholds) {
      if (value >= threshold) {
        color = options.thresholds[threshold];
      }
    }
  }
  
  // Calcular ángulo del medidor (0 a 180 grados)
  const angle = (value / (options.max - options.min)) * 180;
  
  // Actualizar medidor visual
  element.innerHTML = `
    <div class="gauge-container">
      <div class="gauge-title">${options.title}</div>
      <div class="gauge-value text-${color}">${value}${options.units}</div>
      <div class="gauge-visual">
        <div class="gauge-arc">
          <div class="gauge-fill bg-${color}" style="transform: rotate(${angle}deg);"></div>
        </div>
        <div class="gauge-center"></div>
      </div>
    </div>
  `;
}

// Función para actualizar gráfico de red
function updateNetworkGraph(elementId, data) {
  const element = document.getElementById(elementId);
  if (!element || !element.getContext) return;
  
  const ctx = element.getContext('2d');
  
  // Extraer datos para el gráfico
  const timestamps = data.history.map(item => item.timestamp);
  const download = data.history.map(item => item.download);
  const upload = data.history.map(item => item.upload);
  
  // Crear o actualizar gráfico
  if (window.networkChart) {
    window.networkChart.data.labels = timestamps;
    window.networkChart.data.datasets[0].data = download;
    window.networkChart.data.datasets[1].data = upload;
    window.networkChart.update();
  } else {
    window.networkChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'Descarga (KB/s)',
            data: download,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.4
          },
          {
            label: 'Subida (KB/s)',
            data: upload,
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}

// Crear y actualizar un gráfico de actividad
function createActivityChart(elementId, data) {
  if (!data || !data.labels || !data.values || !document.getElementById(elementId)) return;
  
  const ctx = document.getElementById(elementId).getContext('2d');
  
  // Si ya existe un gráfico, actualizarlo
  if (window[`chart_${elementId}`]) {
    window[`chart_${elementId}`].data.labels = data.labels;
    window[`chart_${elementId}`].data.datasets[0].data = data.values;
    window[`chart_${elementId}`].update();
    return;
  }
  
  // Crear nuevo gráfico
  window[`chart_${elementId}`] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Tareas',
        data: data.values,
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 205, 86, 0.2)'
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)',
          'rgb(255, 205, 86)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Crear y actualizar un gráfico circular de aplicaciones
function createAppsChart(elementId, data) {
  if (!data || !data.labels || !data.values || !document.getElementById(elementId)) return;
  
  const ctx = document.getElementById(elementId).getContext('2d');
  
  // Si ya existe un gráfico, actualizarlo
  if (window[`chart_${elementId}`]) {
    window[`chart_${elementId}`].data.labels = data.labels;
    window[`chart_${elementId}`].data.datasets[0].data = data.values;
    window[`chart_${elementId}`].update();
    return;
  }
  
  // Colores para cada aplicación
  const backgroundColors = [
    'rgba(255, 99, 132, 0.2)',
    'rgba(54, 162, 235, 0.2)',
    'rgba(255, 206, 86, 0.2)',
    'rgba(75, 192, 192, 0.2)',
    'rgba(153, 102, 255, 0.2)'
  ];
  
  const borderColors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)'
  ];
  
  // Crear nuevo gráfico
  window[`chart_${elementId}`] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Tareas por aplicación',
        data: data.values,
        backgroundColor: backgroundColors.slice(0, data.labels.length),
        borderColor: borderColors.slice(0, data.labels.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Exportar datos a CSV
function exportDataToCSV(type) {
  $.ajax({
    url: `/api/export/${type}`,
    method: 'GET',
    success: function(data) {
      // Crear blob y descargar
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showNotification(`Datos de ${type} exportados exitosamente`);
    },
    error: function(err) {
      console.error(`Error al exportar datos ${type}:`, err);
      showNotification(`Error al exportar datos de ${type}`, 'error');
    }
  });
}

// Función para añadir tareas en lote
function addBatchTasks() {
  // Obtener datos del formulario de lote
  const appPackage = $('#batchAppPackage').val();
  const taskList = $('#batchTaskList').val();
  const priority = $('#batchPriority').val();
  
  if (!appPackage || !taskList) {
    showNotification('Por favor completa todos los campos', 'error');
    return;
  }
  
  // Convertir lista de tareas a array
  const tasks = taskList.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => ({
      appPackage: appPackage,
      videoUrls: line,
      priority: priority
    }));
  
  if (tasks.length === 0) {
    showNotification('No se encontraron tareas válidas', 'error');
    return;
  }
  
  // Mostrar confirmación
  if (!confirm(`¿Estás seguro de añadir ${tasks.length} tareas?`)) {
    return;
  }
  
  // Enviar solicitud
  $.ajax({
    url: '/api/tasks/batch',
    method: 'POST',
    data: JSON.stringify({ tasks }),
    contentType: 'application/json',
    success: function(response) {
      // Cerrar modal
      $('#batchTaskModal').modal('hide');
      
      // Limpiar formulario
      $('#batchTaskList').val('');
      $('#batchPriority').val(5);
      
      showNotification(`${response.created} tareas creadas exitosamente`);
      
      // Recargar datos
      loadTasks();
      updateTaskCounters();
    },
    error: function(err) {
      console.error('Error al añadir tareas en lote:', err);
      showNotification('Error al añadir tareas en lote', 'error');
    }
  });
}
