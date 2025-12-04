const pool = require("../config/database")

const logAction = async (userId, action, table = null, recordId = null, details = null, ip = null) => {
  try {
    await pool.execute(
      "INSERT INTO logs (usuario_id, accion, tabla, registro_id, detalles, ip) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, action, table, recordId, details, ip],
    )
  } catch (error) {
    console.error("Error al registrar log:", error)
  }
}

module.exports = { logAction }
