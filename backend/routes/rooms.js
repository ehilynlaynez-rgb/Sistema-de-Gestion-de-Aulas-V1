const express = require("express")
const router = express.Router()
const QRCode = require("qrcode")
const pool = require("../config/database")
const { requireAuth } = require("../middleware/auth")
const { logAction } = require("../middleware/logger")

// ============ OBTENER TODAS LAS AULAS ============
router.get("/", async (req, res) => {
  try {
    const [rooms] = await pool.execute(`
      SELECT 
        r.id,
        r.nombre,
        r.modulo,
        r.estado,
        r.ocupado_por,
        r.qr_url,
        r.creado_en,
        u.nombre AS ocupado_por_nombre
      FROM rooms r
      LEFT JOIN users u ON r.ocupado_por = u.id
      ORDER BY r.id
    `)

    res.json(rooms)
  } catch (error) {
    console.error("❌ Error al obtener aulas:", error)
    res.status(500).json({ error: "Error al obtener aulas" })
  }
})


// ============ OBTENER AULA POR ID ============
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const [rooms] = await pool.execute(
      `
        SELECT 
          r.id,
          r.nombre,
          r.modulo,
          r.estado,
          r.ocupado_por,
          r.qr_url,
          r.creado_en,
          u.nombre AS ocupado_por_nombre
        FROM rooms r
        LEFT JOIN users u ON r.ocupado_por = u.id
        WHERE r.id = ?
      `,
      [id]
    )

    if (rooms.length === 0) {
      return res.status(404).json({ error: "Aula no encontrada" })
    }

    res.json(rooms[0])
  } catch (error) {
    console.error("❌ Error al obtener aula:", error)
    res.status(500).json({ error: "Error al obtener aula" })
  }
})


// ============ GENERAR QR DEL AULA ============
router.post("/:id/generate-qr", async (req, res) => {
  try {
    const { id } = req.params

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"
    const qrUrl = `${frontendUrl}/aula.html?id=${id}`

    const qrCode = await QRCode.toDataURL(qrUrl)

    await pool.execute(
      "UPDATE rooms SET qr_url = ? WHERE id = ?",
      [qrCode, id]
    )

    if (req.session?.userId) {
      await logAction(
        req.session.userId,
        "QR generado para aula",
        "rooms",
        id,
        null,
        req.ip
      )
    }

    res.json({ success: true, qr_url: qrCode })
  } catch (error) {
    console.error("❌ Error al generar QR:", error)
    res.status(500).json({ error: "Error al generar código QR" })
  }
})

module.exports = router
