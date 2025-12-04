const express = require("express")
const router = express.Router()
const pool = require("../config/database")
const { requireAuth } = require("../middleware/auth")

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const [totalAulas] = await pool.execute("SELECT COUNT(*) as total FROM rooms")
    const [aulasLibres] = await pool.execute("SELECT COUNT(*) as total FROM rooms WHERE estado = ?", ["Libre"])
    const [aulasOcupadas] = await pool.execute("SELECT COUNT(*) as total FROM rooms WHERE estado = ?", ["Ocupada"])

    const [totalRecursos] = await pool.execute("SELECT COUNT(*) as total FROM resources")
    const [recursosActivos] = await pool.execute("SELECT COUNT(*) as total FROM resources WHERE estado = ?", ["Activo"])
    const [recursosDanados] = await pool.execute("SELECT COUNT(*) as total FROM resources WHERE estado = ?", ["Dañado"])

    const [totalReservas] = await pool.execute("SELECT COUNT(*) as total FROM reservations")
    const [reservasActivas] = await pool.execute("SELECT COUNT(*) as total FROM reservations WHERE estado = ?", [
      "Activa",
    ])
    const [reservasHoy] = await pool.execute("SELECT COUNT(*) as total FROM reservations WHERE fecha = CURDATE()")

    const [totalUsuarios] = await pool.execute("SELECT COUNT(*) as total FROM users")

    res.json({
      aulas: {
        total: totalAulas[0].total,
        libres: aulasLibres[0].total,
        ocupadas: aulasOcupadas[0].total,
      },
      recursos: {
        total: totalRecursos[0].total,
        activos: recursosActivos[0].total,
        danados: recursosDanados[0].total,
      },
      reservas: {
        total: totalReservas[0].total,
        activas: reservasActivas[0].total,
        hoy: reservasHoy[0].total,
      },
      usuarios: {
        total: totalUsuarios[0].total,
      },
    })
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    res.status(500).json({ error: "Error al obtener estadísticas" })
  }
})

router.get("/reservas-recientes", requireAuth, async (req, res) => {
  try {
    const [reservations] = await pool.execute(`
            SELECT 
                res.id,
                res.fecha,
                res.hora_inicio,
                res.hora_fin,
                res.estado,
                u.nombre as instructor,
                r.nombre as aula,
                r.modulo
            FROM reservations res
            JOIN users u ON res.instructor_id = u.id
            JOIN rooms r ON res.aula_id = r.id
            ORDER BY res.creado_en DESC
            LIMIT 10
        `)
    res.json(reservations)
  } catch (error) {
    console.error("Error al obtener reservas recientes:", error)
    res.status(500).json({ error: "Error al obtener reservas recientes" })
  }
})

module.exports = router
