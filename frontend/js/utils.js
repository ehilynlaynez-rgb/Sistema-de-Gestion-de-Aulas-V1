const API_URL = "/api"

async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/auth/session`, {
      credentials: "include",
    })
    const data = await response.json()

    if (!data.authenticated) {
      if (!window.location.pathname.endsWith("index.html") && !window.location.pathname.endsWith("/")) {
        window.location.href = "/index.html"
      }
      return null
    }

    return data.user
  } catch (error) {
    console.error("Error al verificar autenticación:", error)
    window.location.href = "/index.html"
    return null
  }
}

async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
    window.location.href = "/index.html"
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
  }
}

function showError(message) {
  alert(message)
}

function showSuccess(message) {
  alert(message)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("es-MX")
}

function formatDateTime(datetime) {
  return new Date(datetime).toLocaleString("es-MX")
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "Activa":
    case "Activo":
    case "Libre":
      return "success"
    case "Cancelada":
    case "Dañado":
    case "Ocupada":
      return "danger"
    case "Completada":
    case "Reparado":
      return "info"
    default:
      return "warning"
  }
}

if (document.getElementById("logoutBtn")) {
  document.getElementById("logoutBtn").addEventListener("click", logout)
}
