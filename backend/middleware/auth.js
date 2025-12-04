const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autorizado. Debe iniciar sesión" })
  }
  next()
}

const requireAdmin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autorizado. Debe iniciar sesión" })
  }
  if (req.session.userRole !== "ADMIN") {
    return res.status(403).json({ error: "Acceso denegado. Solo administradores" })
  }
  next()
}

module.exports = { requireAuth, requireAdmin }
