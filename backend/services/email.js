const nodemailer = require("nodemailer")
require("dotenv").config()

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendReservationEmail = async (reservation) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Credenciales de email no configuradas")
      return
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: reservation.instructor_email,
      cc: process.env.EMAIL_USER,
      subject: `Confirmación de Reserva - ${reservation.aula_nombre}`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Confirmación de Reserva</h2>
                    <p>Estimado/a <strong>${reservation.instructor_nombre}</strong>,</p>
                    <p>Su reserva ha sido confirmada con los siguientes detalles:</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Aula:</strong> ${reservation.aula_nombre}</p>
                        <p><strong>Módulo:</strong> ${reservation.aula_modulo}</p>
                        <p><strong>Fecha:</strong> ${reservation.fecha}</p>
                        <p><strong>Hora:</strong> ${reservation.hora_inicio} - ${reservation.hora_fin}</p>
                        ${reservation.grupo_whatsapp ? `<p><strong>Grupo WhatsApp:</strong> ${reservation.grupo_whatsapp}</p>` : ""}
                    </div>
                    
                    <p>Por favor, llegue puntualmente a su clase.</p>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                        Este es un correo automático, por favor no responda a este mensaje.
                    </p>
                </div>
            `,
    }

    await transporter.sendMail(mailOptions)
    console.log("Email enviado exitosamente")
  } catch (error) {
    console.error("Error al enviar email:", error)
    throw error
  }
}

module.exports = { sendReservationEmail }
