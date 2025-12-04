let currentUser = null
const API_URL = "/api"

async function checkAuth() {
  // Simulated checkAuth function for demonstration purposes
  return { nombre: "John Doe", rol: "ADMIN" }
}

function showError(message) {
  // Simulated showError function for demonstration purposes
  alert(message)
}

function showSuccess(message) {
  // Simulated showSuccess function for demonstration purposes
  alert(message)
}

function getStatusBadgeClass(status) {
  // Simulated getStatusBadgeClass function for demonstration purposes
  switch (status) {
    case "Activo":
      return "bg-success"
    case "Dañado":
      return "bg-danger"
    case "Reparado":
      return "bg-warning"
    default:
      return "bg-secondary"
  }
}

async function init() {
  currentUser = await checkAuth()
  if (!currentUser) return

  document.getElementById("userNameDisplay").textContent = currentUser.nombre

  if (currentUser.rol === "ADMIN") {
    document.getElementById("adminResourceButtons").style.display = "block"
    document.getElementById("adminActionsHeader").style.display = "table-cell"
  }

  loadFilters()
}

async function loadFilters() {
  try {
    console.log("[v0] Cargando filtros de recursos")

    const [roomsResponse, typesResponse] = await Promise.all([
      fetch(`${API_URL}/rooms`, { credentials: "include" }),
      fetch(`${API_URL}/resources/tipos`, { credentials: "include" }),
    ])

    if (!roomsResponse.ok || !typesResponse.ok) {
      throw new Error("Error al cargar filtros")
    }

    const rooms = await roomsResponse.json()
    const types = await typesResponse.json()

    console.log("[v0] Aulas y tipos cargados:", { rooms, types })

    const filterAula = document.getElementById("filterAula")
    const resourceAula = document.getElementById("resourceAula")

    filterAula.innerHTML =
      '<option value="">Todas las aulas</option>' +
      rooms.map((r) => `<option value="${r.id}">${r.nombre} - ${r.modulo}</option>`).join("")

    if (resourceAula) {
      resourceAula.innerHTML = rooms.map((r) => `<option value="${r.id}">${r.nombre} - ${r.modulo}</option>`).join("")
    }

    const filterTipo = document.getElementById("filterTipo")
    filterTipo.innerHTML =
      '<option value="">Todos los tipos</option>' + types.map((t) => `<option value="${t}">${t}</option>`).join("")
  } catch (error) {
    console.error("[v0] Error al cargar filtros:", error)
    showError("Error al cargar filtros. Verifique que el servidor esté ejecutándose.")
  }
}

async function loadResources() {
  try {
    const aulaId = document.getElementById("filterAula").value
    const tipo = document.getElementById("filterTipo").value
    const estado = document.getElementById("filterEstado").value

    console.log("[v0] Filtrando recursos con:", { aulaId, tipo, estado })

    const params = new URLSearchParams()
    if (aulaId) params.append("aula_id", aulaId)
    if (tipo) params.append("tipo", tipo)
    if (estado) params.append("estado", estado)

    const response = await fetch(`${API_URL}/resources?${params}`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const resources = await response.json()
    console.log("[v0] Recursos recibidos:", resources.length)

    const tbody = document.getElementById("resourcesTable")

    if (resources.length === 0) {
      const colspan = currentUser.rol === "ADMIN" ? 5 : 4
      tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">No se encontraron recursos</td></tr>`
      return
    }

    tbody.innerHTML = resources
      .map(
        (r) => `
            <tr>
                <td>${r.aula_nombre}</td>
                <td>${r.tipo}</td>
                <td>${r.codigo}</td>
                <td><span class="badge ${getStatusBadgeClass(r.estado)}">${r.estado}</span></td>
                ${
                  currentUser.rol === "ADMIN"
                    ? `
                    <td>
                        ${r.estado === "Dañado" ? `<button class="btn-success btn-sm" onclick="updateResourceStatus(${r.id}, 'Reparado')">Marcar Reparado</button>` : ""}
                        ${r.estado === "Activo" ? `<button class="btn-warning btn-sm" onclick="updateResourceStatus(${r.id}, 'Dañado')">Marcar Dañado</button>` : ""}
                        <button class="btn-danger btn-sm" onclick="deleteResource(${r.id})">Eliminar</button>
                    </td>
                `
                    : ""
                }
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("[v0] Error al cargar recursos:", error)
    const tbody = document.getElementById("resourcesTable")
    const colspan = currentUser.rol === "ADMIN" ? 5 : 4
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center" style="color: red;">Error al cargar recursos</td></tr>`
  }
}

function showResourceModal() {
  document.getElementById("resourceModal").style.display = "block"
  document.getElementById("resourceForm").reset()
}

function closeResourceModal() {
  document.getElementById("resourceModal").style.display = "none"
}

document.getElementById("resourceForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const aula_id = document.getElementById("resourceAula").value
  const tipo = document.getElementById("resourceTipo").value
  const codigo = document.getElementById("resourceCodigo").value
  const estado = document.getElementById("resourceEstado").value

  try {
    const response = await fetch(`${API_URL}/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ aula_id, tipo, codigo, estado }),
    })

    if (response.ok) {
      showSuccess("Recurso creado exitosamente")
      closeResourceModal()
      loadResources()
    } else {
      const data = await response.json()
      showError(data.error || "Error al crear recurso")
    }
  } catch (error) {
    console.error("Error:", error)
    showError("Error de conexión")
  }
})

async function updateResourceStatus(resourceId, newStatus) {
  try {
    const response = await fetch(`${API_URL}/resources/${resourceId}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ estado: newStatus }),
    })

    if (response.ok) {
      showSuccess("Estado actualizado exitosamente")
      loadResources()
    } else {
      const data = await response.json()
      showError(data.error || "Error al actualizar estado")
    }
  } catch (error) {
    console.error("Error:", error)
    showError("Error de conexión")
  }
}

async function deleteResource(resourceId) {
  if (!confirm("¿Está seguro de eliminar este recurso?")) return

  try {
    const response = await fetch(`${API_URL}/resources/${resourceId}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (response.ok) {
      showSuccess("Recurso eliminado exitosamente")
      loadResources()
    } else {
      const data = await response.json()
      showError(data.error || "Error al eliminar recurso")
    }
  } catch (error) {
    console.error("Error:", error)
    showError("Error de conexión")
  }
}

window.onclick = (event) => {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none"
  }
}

init()
