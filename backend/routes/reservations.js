const express = require("express")
const router = express.Router()
const pool = require("../config/database")
const { requireAuth } = require("../middleware/auth")
const { logAction } = require("../middleware/logger")
const { sendReservationEmail } = require("../services/email")
const { sendWhatsAppNotification } = require("../services/whatsapp")
const XLSX = require("xlsx")

router.get("/", requireAuth, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, aula_id, estado } = req.query

    let query = `
            SELECT 
                res.*, 
                u.nombre as instructor_nombre,
                u.email as instructor_email,
                r.nombre as aula_nombre,
                r.modulo as aula_modulo
            FROM reservations res
            JOIN users u ON res.instructor_id = u.id
            JOIN rooms r ON res.aula_id = r.id
            WHERE 1=1
        `
    const params = []

    if (fecha_desde) {
      query += " AND res.fecha >= ?"
      params.push(fecha_desde)
    }
    if (fecha_hasta) {
      query += " AND res.fecha <= ?"
      params.push(fecha_hasta)
    }
    if (aula_id) {
      query += " AND res.aula_id = ?"
      params.push(aula_id)
    }
    if (estado) {
      query += " AND res.estado = ?"
      params.push(estado)
    }

    query += " ORDER BY res.fecha DESC, res.hora_inicio DESC"

    const [reservations] = await pool.execute(query, params)
    res.json(reservations)
  } catch (error) {
    console.error("Error al obtener reservas:", error)
    res.status(500).json({ error: "Error al obtener reservas" })
  }
})

router.post("/", requireAuth, async (req, res) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { aula_id, fecha, hora_inicio, hora_fin, grupo_whatsapp } = req.body
    const instructor_id = req.session.userId

    if (!aula_id || !fecha || !hora_inicio || !hora_fin) {
      await connection.rollback()
      return res.status(400).json({ error: "Todos los campos son requeridos" })
    }

    const fechaReserva = new Date(fecha + "T00:00:00")
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const maxFecha = new Date(hoy)
    maxFecha.setDate(maxFecha.getDate() + 7)

    if (fechaReserva < hoy) {
      await connection.rollback()
      return res.status(400).json({ error: "No se puede reservar en fechas pasadas" })
    }

    if (fechaReserva > maxFecha) {
      await connection.rollback()
      return res.status(400).json({ error: "Solo se pueden hacer reservas hasta 7 días adelante" })
    }

    const [conflicts] = await connection.execute(
      `
            SELECT id FROM reservations 
            WHERE aula_id = ? 
            AND fecha = ? 
            AND estado = 'Activa'
            AND (
                (hora_inicio < ? AND hora_fin > ?) OR
                (hora_inicio < ? AND hora_fin > ?) OR
                (hora_inicio >= ? AND hora_fin <= ?)
            )
        `,
      [aula_id, fecha, hora_fin, hora_inicio, hora_fin, hora_fin, hora_inicio, hora_fin],
    )

    if (conflicts.length > 0) {
      await connection.rollback()
      return res.status(400).json({ error: "Ya existe una reserva en ese horario" })
    }

    const [result] = await connection.execute(
      "INSERT INTO reservations (instructor_id, aula_id, fecha, hora_inicio, hora_fin, grupo_whatsapp, estado) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [instructor_id, aula_id, fecha, hora_inicio, hora_fin, grupo_whatsapp, "Activa"],
    )

    await connection.execute("UPDATE rooms SET estado = ?, ocupado_por = ? WHERE id = ?", [
      "Ocupada",
      instructor_id,
      aula_id,
    ])

    const [reservationData] = await connection.execute(
      `
            SELECT 
                res.*, 
                u.nombre as instructor_nombre,
                u.email as instructor_email,
                r.nombre as aula_nombre,
                r.modulo as aula_modulo
            FROM reservations res
            JOIN users u ON res.instructor_id = u.id
            JOIN rooms r ON res.aula_id = r.id
            WHERE res.id = ?
        `,
      [result.insertId],
    )

    await connection.commit()

    const reservation = reservationData[0]

    await logAction(
      instructor_id,
      "Reserva creada",
      "reservations",
      result.insertId,
      `Aula: ${reservation.aula_nombre}, Fecha: ${fecha}`,
      req.ip,
    )

    sendReservationEmail(reservation).catch((err) => console.error("Error al enviar email:", err))

    if (grupo_whatsapp) {
      sendWhatsAppNotification(reservation).catch((err) => console.error("Error al enviar WhatsApp:", err))
    }

    res.status(201).json({ success: true, id: result.insertId, reservation })
  } catch (error) {
    await connection.rollback()
    console.error("Error al crear reserva:", error)
    res.status(500).json({ error: "Error al crear reserva" })
  } finally {
    connection.release()
  }
})

router.put("/:id/cancelar", requireAuth, async (req, res) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { id } = req.params

    const [reservation] = await connection.execute("SELECT * FROM reservations WHERE id = ?", [id])

    if (reservation.length === 0) {
      await connection.rollback()
      return res.status(404).json({ error: "Reserva no encontrada" })
    }

    if (reservation[0].instructor_id !== req.session.userId && req.session.userRole !== "ADMIN") {
      await connection.rollback()
      return res.status(403).json({ error: "No tiene permisos para cancelar esta reserva" })
    }

    await connection.execute("UPDATE reservations SET estado = ? WHERE id = ?", ["Cancelada", id])

    await connection.execute("UPDATE rooms SET estado = ?, ocupado_por = NULL WHERE id = ?", [
      "Libre",
      reservation[0].aula_id,
    ])

    await connection.commit()

    await logAction(req.session.userId, "Reserva cancelada", "reservations", id, null, req.ip)

    res.json({ success: true })
  } catch (error) {
    await connection.rollback()
    console.error("Error al cancelar reserva:", error)
    res.status(500).json({ error: "Error al cancelar reserva" })
  } finally {
    connection.release()
  }
})

router.get("/export", requireAuth, async (req, res) => {
  try {
    const [reservations] = await pool.execute(`
            SELECT 
                res.id,
                u.nombre as instructor,
                r.nombre as aula,
                r.modulo,
                res.fecha,
                res.hora_inicio,
                res.hora_fin,
                res.grupo_whatsapp,
                res.estado,
                res.creado_en
            FROM reservations res
            JOIN users u ON res.instructor_id = u.id
            JOIN rooms r ON res.aula_id = r.id
            ORDER BY res.fecha DESC, res.hora_inicio DESC
        `)

    const worksheet = XLSX.utils.json_to_sheet(reservations)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas")

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    res.setHeader("Content-Disposition", "attachment; filename=historial_reservas.xlsx")
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.send(buffer)

    await logAction(req.session.userId, "Historial exportado", "reservations", null, null, req.ip)
  } catch (error) {
    console.error("Error al exportar historial:", error)
    res.status(500).json({ error: "Error al exportar historial" })
  }
})

module.exports = router
