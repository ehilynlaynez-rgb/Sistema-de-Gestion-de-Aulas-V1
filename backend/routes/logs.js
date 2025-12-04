const express = require("express")
const router = express.Router()
const pool = require("../config/database")
const { requireAuth, requireAdmin } = require("../middleware/auth")

router.get("/", requireAdmin, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, usuario_id, accion } = req.query

    let query = `
            SELECT 
                l.*,
                u.nombre as usuario_nombre,
                u.email as usuario_email
            FROM logs l
            LEFT JOIN users u ON l.usuario_id = u.id
            WHERE 1=1
        `
    const params = []

    if (fecha_desde) {
      query += " AND DATE(l.creado_en) >= ?"
      params.push(fecha_desde)
    }
    if (fecha_hasta) {
      query += " AND DATE(l.creado_en) <= ?"
      params.push(fecha_hasta)
    }
    if (usuario_id) {
      query += " AND l.usuario_id = ?"
      params.push(usuario_id)
    }
    if (accion) {
      query += " AND l.accion LIKE ?"
      params.push(`%${accion}%`)
    }

    query += " ORDER BY l.creado_en DESC LIMIT 500"

    const [logs] = await pool.execute(query, params)
    res.json(logs)
  } catch (error) {
    console.error("Error al obtener logs:", error)
    res.status(500).json({ error: "Error al obtener bitácora" })
  }
})

module.exports = router
