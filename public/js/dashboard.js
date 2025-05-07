// Gráficos y datos del dashboard
let appsChart = null;

// Función para cargar datos del dashboard
function loadDashboardData() {
  // Mostrar indicador de carga
  showLoadingIndicator();

  // Cargar resumen de estadísticas
  fetchWithAuth('/api/stats/summary')
    .then(data => {
      if (data.success) {
        updateDashboardStats(data.data);
      } else {
        showNotification('Error al cargar estadísticas', 'danger');
      }
    })
    .catch(error => {
      console.error('Error al cargar datos del dashboard:', error);
      showNotification('Error al cargar datos', 'danger');
    })
    .finally(() => {
      hideLoadingIndicator();
    });

  // Cargar dispositivos activos
  fetchWithAuth('/api/devices')
    .then(data => {
      if (data.success) {
        updateDevicesCount(data.data);
      }
    })
    .catch(error => {
      console.error('Error al cargar dispositivos:', error);
    });

  // Cargar tareas
  fetchWithAuth('/api/tasks')
    .then(data => {
      if (data.success) {
        updateTasksCount(data.data);
      }
    })
    .catch(error => {
      console.error('Error al cargar tareas:', error);
    });
}

// Función para actualizar estadísticas del dashboard
function updateDashboardStats(stats) {
  // Actualizar contadores
  document.getElementById('total-time').textContent = formatTime(stats.totalViewTime || 0);
  document.getElementById('interactions-count').textContent = stats.totalInteractions || 0;

  // Actualizar tabla de actividad reciente
  const tableBody = document.getElementById('activity-table-body');
  tableBody.innerHTML = '';

  if (stats.recentActivity && stats.recentActivity.length > 0) {
    stats.recentActivity.forEach(activity => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${activity.device ? activity.device.name : 'Desconocido'}</td>
        <td>${activity.app ? activity.app.name : 'Desconocida'}</td>
        <td>${formatTime(activity.viewTime)}</td>
        <td><span class="badge bg-success">Completado</span></td>
      `;

      tableBody.appendChild(row);
    });
  } else {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4" class="text-center">No hay actividad reciente</td>';
    tableBody.appendChild(row);
  }

  // Actualizar gráfico de apps
  updateAppsChart(stats.statsByApp || []);
}

// Función para actualizar el contador de dispositivos
function updateDevicesCount(devices) {
  document.getElementById('devices-count').textContent = devices.length || 0;
}

// Función para actualizar el contador de tareas
function updateTasksCount(tasks) {
  document.getElementById('tasks-count').textContent = tasks.length || 0;
}

// Función para actualizar el gráfico de apps
function updateAppsChart(statsByApp) {
  const ctx = document.getElementById('apps-chart').getContext('2d');

  // Destruir gráfico existente si hay uno
  if (appsChart) {
    appsChart.destroy();
  }

  // Preparar datos para el gráfico
  const labels = statsByApp.map(stat => stat.app ? stat.app.name : 'Desconocida');
  const data = statsByApp.map(stat => stat.totalViewTime);
  const colors = generateColors(statsByApp.length);

  // Crear nuevo gráfico
  appsChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Tiempo de Visualización por App'
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${formatTime(value)}`;
            }
          }
        }
      }
    }
  });
}

// Función para generar colores aleatorios
function generateColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 137) % 360; // Distribución uniforme de colores
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  return colors;
}

// Función para mostrar indicador de carga
function showLoadingIndicator() {
  // Implementar indicador de carga si es necesario
}

// Función para ocultar indicador de carga
function hideLoadingIndicator() {
  // Implementar ocultamiento de indicador de carga si es necesario
}

// Función para actualizar estado de dispositivo en tiempo real
function updateDeviceStatus(device) {
  // Actualizar datos en tiempo real si es necesario
  loadDashboardData();
}

// Función para actualizar estado de tarea en tiempo real
function updateTaskStatus(task) {
  // Actualizar datos en tiempo real si es necesario
  loadDashboardData();
}

// Función para actualizar estadísticas en tiempo real
function updateStatistics(stats) {
  // Actualizar datos en tiempo real si es necesario
  loadDashboardData();
}