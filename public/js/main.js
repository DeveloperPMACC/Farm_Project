// Función para manejar el inicio de sesión
function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('username-input').value;
  const password = document.getElementById('password-input').value;
  const errorElement = document.getElementById('login-error');

  // Resetear mensaje de error
  errorElement.classList.add('d-none');

  // Enviar solicitud de inicio de sesión
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Guardar token y datos de usuario
        token = data.data.token;
        currentUser = data.data.user;
        localStorage.setItem('token', token);

        // Cerrar modal y inicializar aplicación
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();

        initializeApp();
      } else {
        // Mostrar error
        errorElement.textContent = data.message || 'Error al iniciar sesión';
        errorElement.classList.remove('d-none');
      }
    })
    .catch(error => {
      console.error('Error al iniciar sesión:', error);
      errorElement.textContent = 'Error de conexión. Inténtelo de nuevo.';
      errorElement.classList.remove('d-none');
    });
}

// Función para cerrar sesión
function logout() {
  // Limpiar datos de sesión
  localStorage.removeItem('token');
  token = null;
  currentUser = null;

  // Desconectar Socket.IO si está activo
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Mostrar modal de login
  showLoginModal();
}

// Función para mostrar modal de login
function showLoginModal() {
  const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  loginModal.show();
}

// Función para cambiar sección activa
function changeSection(section) {
  // Cambiar item activo en sidebar
  document.querySelectorAll('#sidebar li').forEach(item => {
    item.classList.remove('active');
  });

  const activeItem = document.querySelector(`#sidebar a[data-section="${section}"]`).parentNode;
  activeItem.classList.add('active');

  // Cambiar sección visible
  document.querySelectorAll('.content-section').forEach(item => {
    item.classList.remove('active');
  });

  document.getElementById(`${section}-section`).classList.add('active');

  // Cargar datos según la sección
  switch (section) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'devices':
      loadDevicesData();
      break;
    case 'tasks':
      loadTasksData();
      break;
    case 'statistics':
      loadStatisticsData();
      break;
    case 'settings':
      loadSettingsData();
      break;
  }
}

// Función para alternar sidebar
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

// Función para actualizar reloj
function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  const dateString = now.toLocaleDateString();
  document.getElementById('current-time').textContent = `${dateString} ${timeString}`;
}

// Función auxiliar para realizar peticiones autenticadas
async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token inválido, cerrar sesión
    logout();
    throw new Error('Sesión expirada');
  }

  return response.json();
}

// Función para mostrar notificación
function showNotification(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  document.body.appendChild(alertDiv);

  // Auto cerrar después de 5 segundos
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 500);
  }, 5000);
}

// Función para formatear tiempo
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// Función para formatear fecha
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}