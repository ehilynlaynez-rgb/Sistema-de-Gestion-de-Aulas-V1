const express = require("express")
const router = express.Router()
const pool = require("../config/database")
const { requireAuth, requireAdmin } = require("../middleware/auth")
const { logAction } = require("../middleware/logger")

router.get("/", requireAuth, async (req, res) => {
  try {
    const { aula_id, tipo, estado } = req.query

    let query = `
            SELECT r.*, ro.nombre as aula_nombre 
            FROM resources r 
            JOIN rooms ro ON r.aula_id = ro.id 
            WHERE 1=1
        `
    const params = []

    if (aula_id) {
      query += " AND r.aula_id = ?"
      params.push(aula_id)
    }
    if (tipo) {
      query += " AND r.tipo = ?"
      params.push(tipo)
    }
    if (estado) {
      query += " AND r.estado = ?"
      params.push(estado)
    }

    query += " ORDER BY r.aula_id, r.tipo, r.codigo"

    const [resources] = await pool.execute(query, params)
    res.json(resources)
  } catch (error) {
    console.error("Error al obtener recursos:", error)
    res.status(500).json({ error: "Error al obtener recursos" })
  }
})

router.get("/tipos", requireAuth, async (req, res) => {
  try {
    const [tipos] = await pool.execute("SELECT DISTINCT tipo FROM resources ORDER BY tipo")
    res.json(tipos.map((t) => t.tipo))
  } catch (error) {
    console.error("Error al obtener tipos:", error)
    res.status(500).json({ error: "Error al obtener tipos de recursos" })
  }
})

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { aula_id, tipo, codigo, estado } = req.body

    if (!aula_id || !tipo || !codigo) {
      return res.status(400).json({ error: "Aula, tipo y código son requeridos" })
    }

    const [result] = await pool.execute("INSERT INTO resources (aula_id, tipo, codigo, estado) VALUES (?, ?, ?, ?)", [
      aula_id,
      tipo,
      codigo,
      estado || "Activo",
    ])

    await logAction(req.session.userId, "Recurso creado", "resources", result.insertId, `${tipo} - ${codigo}`, req.ip)

    res.status(201).json({ success: true, id: result.insertId })
  } catch (error) {
    console.error("Error al crear recurso:", error)
    res.status(500).json({ error: "Error al crear recurso" })
  }
})

router.put("/:id/estado", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    if (!["Activo", "Dañado", "Reparado"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" })
    }

    await pool.execute("UPDATE resources SET estado = ? WHERE id = ?", [estado, id])

    await logAction(
      req.session.userId,
      "Estado de recurso actualizado",
      "resources",
      id,
      `Nuevo estado: ${estado}`,
      req.ip,
    )

    res.json({ success: true })
  } catch (error) {
    console.error("Error al actualizar estado:", error)
    res.status(500).json({ error: "Error al actualizar estado del recurso" })
  }
})

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const [resource] = await pool.execute("SELECT tipo, codigo FROM resources WHERE id = ?", [id])

    await pool.execute("DELETE FROM resources WHERE id = ?", [id])

    await logAction(
      req.session.userId,
      "Recurso eliminado",
      "resources",
      id,
      resource.length > 0 ? `${resource[0].tipo} - ${resource[0].codigo}` : "",
      req.ip,
    )

    res.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar recurso:", error)
    res.status(500).json({ error: "Error al eliminar recurso" })
  }
})

module.exports = router
