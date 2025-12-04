const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const pool = require("../config/database")
const { requireAuth, requireAdmin } = require("../middleware/auth")
const { logAction } = require("../middleware/logger")

router.get("/", requireAuth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      "SELECT id, nombre, email, rol, telefono, creado_en FROM users ORDER BY creado_en DESC",
    )
    res.json(users)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    res.status(500).json({ error: "Error al obtener usuarios" })
  }
})

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" })
    }

    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ?", [email])

    if (existing.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [result] = await pool.execute(
      "INSERT INTO users (nombre, email, password, rol, telefono) VALUES (?, ?, ?, ?, ?)",
      [nombre, email, hashedPassword, rol || "USUARIO", telefono],
    )

    await logAction(
      req.session.userId,
      "Usuario creado",
      "users",
      result.insertId,
      `Usuario: ${nombre} (${email})`,
      req.ip,
    )

    res.status(201).json({ success: true, id: result.insertId })
  } catch (error) {
    console.error("Error al crear usuario:", error)
    res.status(500).json({ error: "Error al crear usuario" })
  }
})

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, email, password, rol, telefono } = req.body

    const updates = []
    const values = []

    if (nombre) {
      updates.push("nombre = ?")
      values.push(nombre)
    }
    if (email) {
      updates.push("email = ?")
      values.push(email)
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updates.push("password = ?")
      values.push(hashedPassword)
    }
    if (rol) {
      updates.push("rol = ?")
      values.push(rol)
    }
    if (telefono !== undefined) {
      updates.push("telefono = ?")
      values.push(telefono)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No hay datos para actualizar" })
    }

    values.push(id)

    await pool.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values)

    await logAction(
      req.session.userId,
      "Usuario actualizado",
      "users",
      id,
      `Campos actualizados: ${updates.join(", ")}`,
      req.ip,
    )

    res.json({ success: true })
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    res.status(500).json({ error: "Error al actualizar usuario" })
  }
})

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    if (Number.parseInt(id) === req.session.userId) {
      return res.status(400).json({ error: "No puede eliminar su propio usuario" })
    }

    const [user] = await pool.execute("SELECT nombre, email FROM users WHERE id = ?", [id])

    await pool.execute("DELETE FROM users WHERE id = ?", [id])

    await logAction(
      req.session.userId,
      "Usuario eliminado",
      "users",
      id,
      user.length > 0 ? `Usuario: ${user[0].nombre} (${user[0].email})` : "",
      req.ip,
    )

    res.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    res.status(500).json({ error: "Error al eliminar usuario" })
  }
})

module.exports = router
