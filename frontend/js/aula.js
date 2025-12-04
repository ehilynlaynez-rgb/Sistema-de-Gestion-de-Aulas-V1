const API_URL = "https://api.example.com" // Declare API_URL variable

async function init() {
  const urlParams = new URLSearchParams(window.location.search)
  const aulaId = urlParams.get("id")

  if (!aulaId) {
    document.getElementById("aulaDetail").innerHTML = '<div class="text-center">Aula no especificada</div>'
    return
  }

  await loadAulaDetail(aulaId)
}

async function loadAulaDetail(aulaId) {
  try {
    const response = await fetch(`${API_URL}/rooms/${aulaId}`, {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Aula no encontrada")
    }

    const aula = await response.json()

    document.getElementById("aulaDetail").innerHTML = `
            <h1>${aula.nombre}</h1>
            <div class="aula-detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Módulo</div>
                    <div class="detail-value">${aula.modulo}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Estado</div>
                    <div class="detail-value">
                        <span class="room-status ${aula.estado.toLowerCase()}">${aula.estado}</span>
                    </div>
                </div>
                ${
                  aula.ocupado_por_nombre
                    ? `
                    <div class="detail-item">
                        <div class="detail-label">Ocupado por</div>
                        <div class="detail-value">${aula.ocupado_por_nombre}</div>
                    </div>
                `
                    : ""
                }
            </div>
            
            <div style="margin-top: 24px;">
                <h2 style="margin-bottom: 16px;">Ubicación</h2>
                <p style="color: var(--secondary-color);">
                    El aula ${aula.nombre} se encuentra en el ${aula.modulo} de la institución.
                </p>
            </div>
        `
  } catch (error) {
    console.error("Error al cargar detalles del aula:", error)
    document.getElementById("aulaDetail").innerHTML =
      '<div class="text-center">Error al cargar información del aula</div>'
  }
}

init()
