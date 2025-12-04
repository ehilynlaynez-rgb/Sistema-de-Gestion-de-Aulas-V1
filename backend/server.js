const express = require("express")
const session = require("express-session")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secreto-temporal-cambiar",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
)

app.use(express.static(path.join(__dirname, "../frontend")))

const authRoutes = require("./routes/auth")
const usersRoutes = require("./routes/users")
const roomsRoutes = require("./routes/rooms")
const resourcesRoutes = require("./routes/resources")
const reservationsRoutes = require("./routes/reservations")
const dashboardRoutes = require("./routes/dashboard")
const logsRoutes = require("./routes/logs")

app.use("/api/auth", authRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/rooms", roomsRoutes)
app.use("/api/resources", resourcesRoutes)
app.use("/api/reservations", reservationsRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/logs", logsRoutes)

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`)
})
