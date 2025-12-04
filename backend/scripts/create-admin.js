const bcrypt = require("bcrypt")
const mysql = require("mysql2/promise")
require("dotenv").config()

async function createAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "gestion_aulas",
    })

    console.log("Conectado a la base de datos...")

    const password = "admin123"
    const hashedPassword = await bcrypt.hash(password, 10)

    const deleteQuery = "DELETE FROM users WHERE email = ?"
    await connection.execute(deleteQuery, ["admin@institucion.edu"])

    const insertQuery = `
      INSERT INTO users (nombre, email, password, rol, telefono) 
      VALUES (?, ?, ?, ?, ?)
    `

    await connection.execute(insertQuery, [
      "Administrador",
      "admin@institucion.edu",
      hashedPassword,
      "ADMIN",
      "+1234567890",
    ])

    console.log("\n===========================================")
    console.log("USUARIO ADMINISTRADOR CREADO EXITOSAMENTE")
    console.log("===========================================")
    console.log("Email: admin@institucion.edu")
    console.log("Contraseña: admin123")
    console.log("Rol: ADMIN")
    console.log("===========================================\n")

    await connection.end()
    process.exit(0)
  } catch (error) {
    console.error("Error al crear administrador:", error)
    process.exit(1)
  }
}

createAdmin()
