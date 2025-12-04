import { checkAuth, showError } from "./utils.js" // Importing checkAuth and showError functions

let currentUser = null
const API_URL = "/api"

async function init() {
  currentUser = await checkAuth()
  if (!currentUser) return

  document.getElementById("userNameDisplay").textContent = currentUser.nombre
  loadRooms()
}

async function loadRooms() {
  try {
    console.log("[v0] Cargando aulas desde:", `${API_URL}/rooms`)

    const response = await fetch(`${API_URL}/rooms`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const rooms = await response.json()
    console.log("[v0] Aulas recibidas:", rooms)

    const grid = document.getElementById("roomsGrid")

    if (rooms.length === 0) {
      grid.innerHTML = '<div class="text-center">No hay aulas registradas</div>'
      return
    }

    grid.innerHTML = rooms
      .map(
        (r) => `
            <div class="room-card ${r.estado.toLowerCase()}">
                <div class="room-header">
                    <div class="room-title">${r.nombre}</div>
                    <span class="room-status ${r.estado.toLowerCase()}">${r.estado}</span>
                </div>
                <div class="room-info">
                    <p><strong>Módulo:</strong> ${r.modulo}</p>
                    ${r.ocupado_por_nombre ? `<p><strong>Ocupado por:</strong> ${r.ocupado_por_nombre}</p>` : ""}
                </div>
                <div class="room-actions">
                    <button class="btn-primary btn-sm" onclick="viewRoom(${r.id})">Ver Detalles</button>
                    <button class="btn-secondary btn-sm" onclick="showQR(${r.id}, '${r.nombre}')">Ver QR</button>
                </div>
            </div>
        `,
      )
      .join("")
  } catch (error) {
    console.error("[v0] Error al cargar aulas:", error)
    document.getElementById("roomsGrid").innerHTML =
      '<div class="text-center" style="color: red;">Error al cargar aulas. Verifique que el servidor esté ejecutándose y la base de datos tenga las aulas cargadas.</div>'
  }
}

function viewRoom(roomId) {
  window.location.href = `/aula.html?id=${roomId}`
}

async function showQR(roomId, roomName) {
  try {
    const response = await fetch(`${API_URL}/rooms/${roomId}/generate-qr`, {
      method: "POST",
      credentials: "include",
    })
    const data = await response.json()

    document.getElementById("qrImage").src = data.qr_url
    document.getElementById("qrAulaName").textContent = roomName
    document.getElementById("qrModal").style.display = "block"
  } catch (error) {
    console.error("Error al generar QR:", error)
    showError("Error al generar código QR")
  }
}

function closeQRModal() {
  document.getElementById("qrModal").style.display = "none"
}

function downloadQR() {
  const qrImage = document.getElementById("qrImage")
  const link = document.createElement("a")
  link.download = `qr-${document.getElementById("qrAulaName").textContent}.png`
  link.href = qrImage.src
  link.click()
}

window.onclick = (event) => {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none"
  }
}

init()
