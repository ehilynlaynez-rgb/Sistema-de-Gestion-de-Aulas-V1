const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const pool = require("../config/database")
const { logAction } = require("../middleware/logger")

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" })
    }

    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const user = users[0]
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    req.session.userId = user.id
    req.session.userName = user.nombre
    req.session.userEmail = user.email
    req.session.userRole = user.rol

    await logAction(user.id, "Inicio de sesión", null, null, null, req.ip)

    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({ error: "Error al iniciar sesión" })
  }
})

router.post("/logout", async (req, res) => {
  try {
    const userId = req.session.userId

    if (userId) {
      await logAction(userId, "Cierre de sesión", null, null, null, req.ip)
    }

    req.session.destroy()
    res.json({ success: true })
  } catch (error) {
    console.error("Error en logout:", error)
    res.status(500).json({ error: "Error al cerrar sesión" })
  }
})

router.get("/session", (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        nombre: req.session.userName,
        email: req.session.userEmail,
        rol: req.session.userRole,
      },
    })
  } else {
    res.json({ authenticated: false })
  }
})

module.exports = router
