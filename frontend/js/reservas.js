let currentUser = null
const API_URL = "https://api.example.com" // Declare API_URL here

async function checkAuth() {
  // Dummy implementation for checkAuth
  return { nombre: "John Doe", id: 1, rol: "USER" }
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getStatusBadgeClass(status) {
  // Dummy implementation for getStatusBadgeClass
  switch (status) {
    case "Activa":
      return "bg-success"
    case "Cancelada":
      return "bg-danger"
    default:
      return "bg-warning"
  }
}

function showError(message) {
  alert(`Error: ${message}`)
}

function showSuccess(message) {
  alert(`Success: ${message}`)
}

async function init() {
  currentUser = await checkAuth()
  if (!currentUser) return

  document.getElementById("userNameDisplay").textContent = currentUser.nombre

  loadFilters()
  loadReservations()
  setDateLimits()
}

function setDateLimits() {
  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 7)

  const dateInput = document.getElementById("reservationDate")
  dateInput.min = formatDate(today)
  dateInput.max = formatDate(maxDate)
}

async function loadFilters() {
  try {
    const response = await fetch(`${API_URL}/rooms`, { credentials: "include" })
    const rooms = await response.json()

    const filterAula = document.getElementById("filterAula")
    const reservationAula = document.getElementById("reservationAula")

    filterAula.innerHTML =
      '<option value="">Todas las aulas</option>' +
      rooms.map((r) => `<option value="${r.id}">${r.nombre} - ${r.modulo}</option>`).join("")

    reservationAula.innerHTML = rooms.map((r) => `<option value="${r.id}">${r.nombre} - ${r.modulo}</option>`).join("")
  } catch (error) {
    console.error("Error al cargar filtros:", error)
  }
}

async function loadReservations() {
  try {
    const dateFrom = document.getElementById("filterDateFrom").value
    const dateTo = document.getElementById("filterDateTo").value
    const aulaId = document.getElementById("filterAula").value
    const estado = document.getElementById("filterEstado").value

    const params = new URLSearchParams()
    if (dateFrom) params.append("fecha_desde", dateFrom)
    if (dateTo) params.append("fecha_hasta", dateTo)
    if (aulaId) params.append("aula_id", aulaId)
    if (estado) params.append("estado", estado)

    const response = await fetch(`${API_URL}/reservations?${params}`, {
      credentials: "include",
    })
    const reservations = await response.json()

    const tbody = document.getElementById("reservationsTable")

    if (reservations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay reservas</td></tr>'
      return
    }

    tbody.innerHTML = reservations
      .map(
        (r) => `
            <tr>
                <td>${r.aula_nombre}</td>
                <td>${r.aula_modulo}</td>
                <td>${r.instructor_nombre}</td>
                <td>${formatDate(r.fecha)}</td>
                <td>${r.hora_inicio} - ${r.hora_fin}</td>
                <td>${r.grupo_whatsapp || "-"}</td>
                <td><span class="badge ${getStatusBadgeClass(r.estado)}">${r.estado}</span></td>
                <td>
                    ${
                      r.estado === "Activa" && (r.instructor_id === currentUser.id || currentUser.rol === "ADMIN")
                        ? `<button class="btn-danger btn-sm" onclick="cancelReservation(${r.id})">Cancelar</button>`
                        : "-"
                    }
                </td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("Error al cargar reservas:", error)
  }
}

function showReservationModal() {
  document.getElementById("reservationModal").style.display = "block"
  document.getElementById("reservationForm").reset()
}

function closeReservationModal() {
  document.getElementById("reservationModal").style.display = "none"
}

document.getElementById("reservationForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const aula_id = document.getElementById("reservationAula").value
  const fecha = document.getElementById("reservationDate").value
  const hora_inicio = document.getElementById("reservationStartTime").value
  const hora_fin = document.getElementById("reservationEndTime").value
  const grupo_whatsapp = document.getElementById("reservationWhatsApp").value

  if (hora_inicio >= hora_fin) {
    showError("La hora de fin debe ser posterior a la hora de inicio")
    return
  }

  try {
    const response = await fetch(`${API_URL}/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ aula_id, fecha, hora_inicio, hora_fin, grupo_whatsapp }),
    })

    if (response.ok) {
      showSuccess("Reserva creada exitosamente")
      closeReservationModal()
      loadReservations()
    } else {
      const data = await response.json()
      showError(data.error || "Error al crear reserva")
    }
  } catch (error) {
    console.error("Error:", error)
    showError("Error de conexión")
  }
})

async function cancelReservation(reservationId) {
  if (!confirm("¿Está seguro de cancelar esta reserva?")) return

  try {
    const response = await fetch(`${API_URL}/reservations/${reservationId}/cancelar`, {
      method: "PUT",
      credentials: "include",
    })

    if (response.ok) {
      showSuccess("Reserva cancelada exitosamente")
      loadReservations()
    } else {
      const data = await response.json()
      showError(data.error || "Error al cancelar reserva")
    }
  } catch (error) {
    console.error("Error:", error)
    showError("Error de conexión")
  }
}

async function exportHistorial() {
  try {
    const response = await fetch(`${API_URL}/reservations/export`, {
      credentials: "include",
    })

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "historial_reservas.xlsx"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error("Error al exportar historial:", error)
    showError("Error al descargar historial")
  }
}

window.onclick = (event) => {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none"
  }
}

init()
