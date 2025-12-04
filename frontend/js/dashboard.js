// Importing necessary functions from utils.js
import { checkAuth, showError, showSuccess, formatDate, formatDateTime, getStatusBadgeClass } from "./utils.js"

let currentUser = null
const API_URL = "/api"

async function init() {
  currentUser = await checkAuth()
  if (!currentUser) return

  document.getElementById("userNameDisplay").textContent = currentUser.nombre

  if (currentUser.rol === "ADMIN") {
    document.getElementById("adminSection").style.display = "block"
    loadUsers()
    loadLogs()
  }

  loadStats()
  loadRecentReservations()
}

async function loadStats() {
  try {
    console.log("[v0] Cargando estadísticas del dashboard")

    const response = await fetch(`${API_URL}/dashboard/stats`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Estadísticas recibidas:", data)

    document.getElementById("totalAulas").textContent = data.aulas.total
    document.getElementById("aulasLibres").textContent = data.aulas.libres
    document.getElementById("aulasOcupadas").textContent = data.aulas.ocupadas
    document.getElementById("totalRecursos").textContent = data.recursos.total
    document.getElementById("recursosDanados").textContent = data.recursos.danados
    document.getElementById("reservasActivas").textContent = data.reservas.activas
    document.getElementById("reservasHoy").textContent = data.reservas.hoy
    document.getElementById("totalUsuarios").textContent = data.usuarios.total
  } catch (error) {
    console.error("[v0] Error al cargar estadísticas:", error)
    showError("Error al cargar estadísticas del sistema")
  }
}

async function loadRecentReservations() {
  try {
    console.log("[v0] Cargando reservas recientes")

    const response = await fetch(`${API_URL}/dashboard/reservas-recientes`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const reservations = await response.json()
    console.log("[v0] Reservas recientes:", reservations.length)

    const tbody = document.getElementById("recentReservationsTable")

    if (reservations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay reservas recientes</td></tr>'
      return
    }

    tbody.innerHTML = reservations
      .map(
        (r) => `
            <tr>
                <td>${r.aula}</td>
                <td>${r.modulo}</td>
                <td>${r.instructor}</td>
                <td>${formatDate(r.fecha)}</td>
                <td>${r.hora_inicio} - ${r.hora_fin}</td>
                <td><span class="badge ${getStatusBadgeClass(r.estado)}">${r.estado}</span></td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("[v0] Error al cargar reservas recientes:", error)
  }
}

async function loadUsers() {
  try {
    console.log("[v0] Cargando lista de usuarios")

    const response = await fetch(`${API_URL}/users`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const users = await response.json()
    console.log("[v0] Usuarios cargados:", users.length)

    const tbody = document.getElementById("usersTable")

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay usuarios registrados</td></tr>'
      return
    }

    tbody.innerHTML = users
      .map(
        (u) => `
            <tr>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td><span class="badge ${u.rol === "ADMIN" ? "warning" : "info"}">${u.rol}</span></td>
                <td>${u.telefono || "-"}</td>
                <td>
                    <button class="btn-secondary btn-sm" onclick="editUser(${u.id})">Editar</button>
                    ${u.id !== currentUser.id ? `<button class="btn-danger btn-sm" onclick="deleteUser(${u.id})">Eliminar</button>` : ""}
                </td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("[v0] Error al cargar usuarios:", error)
    document.getElementById("usersTable").innerHTML =
      '<tr><td colspan="5" class="text-center" style="color: red;">Error al cargar usuarios</td></tr>'
  }
}

function showUserModal(userId = null) {
  document.getElementById("userModal").style.display = "block"
  document.getElementById("userForm").reset()
  document.getElementById("userId").value = ""
  document.getElementById("userModalTitle").textContent = "Nuevo Usuario"

  const passwordField = document.getElementById("userPassword")
  if (!userId) {
    passwordField.required = true
  } else {
    passwordField.required = false
    document.getElementById("userModalTitle").textContent = "Editar Usuario"
  }
}

function closeUserModal() {
  document.getElementById("userModal").style.display = "none"
}

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const userId = document.getElementById("userId").value
  const nombre = document.getElementById("userName").value
  const email = document.getElementById("userEmail").value
  const password = document.getElementById("userPassword").value
  const rol = document.getElementById("userRole").value
  const telefono = document.getElementById("userPhone").value

  const body = { nombre, email, rol, telefono }
  if (password) body.password = password

  try {
    const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/users`
    const method = userId ? "PUT" : "POST"

    console.log("[v0] Guardando usuario:", { url, method, body })

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const message = userId
        ? "Usuario actualizado exitosamente"
        : `Usuario creado exitosamente.\n\nCREDENCIALES:\nEmail: ${email}\nContraseña: ${password}\n\nComparta estas credenciales con el usuario.`
      showSuccess(message)
      closeUserModal()
      loadUsers()
      loadStats()
    } else {
      const data = await response.json()
      showError(data.error || "Error al guardar usuario")
    }
  } catch (error) {
    console.error("[v0] Error:", error)
    showError("Error de conexión")
  }
})

async function editUser(userId) {
  try {
    const response = await fetch(`${API_URL}/users`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Error al obtener usuarios")
    }

    const users = await response.json()
    const user = users.find((u) => u.id === userId)

    if (user) {
      document.getElementById("userId").value = user.id
      document.getElementById("userName").value = user.nombre
      document.getElementById("userEmail").value = user.email
      document.getElementById("userRole").value = user.rol
      document.getElementById("userPhone").value = user.telefono || ""
      document.getElementById("userPassword").value = ""
      showUserModal(userId)
    }
  } catch (error) {
    console.error("[v0] Error:", error)
    showError("Error al cargar datos del usuario")
  }
}

async function deleteUser(userId) {
  if (!confirm("¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.")) return

  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (response.ok) {
      showSuccess("Usuario eliminado exitosamente")
      loadUsers()
      loadStats()
    } else {
      const data = await response.json()
      showError(data.error || "Error al eliminar usuario")
    }
  } catch (error) {
    console.error("[v0] Error:", error)
    showError("Error de conexión")
  }
}

async function loadLogs() {
  try {
    const dateFrom = document.getElementById("logDateFrom").value
    const dateTo = document.getElementById("logDateTo").value
    const action = document.getElementById("logAction").value

    console.log("[v0] Cargando logs con filtros:", { dateFrom, dateTo, action })

    const params = new URLSearchParams()
    if (dateFrom) params.append("fecha_desde", dateFrom)
    if (dateTo) params.append("fecha_hasta", dateTo)
    if (action) params.append("accion", action)

    const response = await fetch(`${API_URL}/logs?${params}`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const logs = await response.json()
    console.log("[v0] Logs cargados:", logs.length)

    const tbody = document.getElementById("logsTable")

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros</td></tr>'
      return
    }

    tbody.innerHTML = logs
      .map(
        (l) => `
            <tr>
                <td>${formatDateTime(l.creado_en)}</td>
                <td>${l.usuario_nombre || "Sistema"}</td>
                <td>${l.accion}</td>
                <td>${l.tabla || "-"}</td>
                <td>${l.detalles || "-"}</td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("[v0] Error al cargar logs:", error)
    document.getElementById("logsTable").innerHTML =
      '<tr><td colspan="5" class="text-center" style="color: red;">Error al cargar bitácora</td></tr>'
  }
}

window.onclick = (event) => {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none"
  }
}

init()
