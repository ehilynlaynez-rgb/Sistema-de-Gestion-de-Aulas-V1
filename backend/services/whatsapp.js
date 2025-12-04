const twilio = require("twilio")
require("dotenv").config()

let twilioClient = null

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

const sendWhatsAppNotification = async (reservation) => {
  try {
    if (!twilioClient) {
      console.log("Credenciales de Twilio no configuradas")
      return
    }

    if (!reservation.grupo_whatsapp) {
      console.log("No se proporcionó grupo de WhatsApp")
      return
    }

    const message = `
🏫 *Reserva de Aula Confirmada*

📍 *Aula:* ${reservation.aula_nombre}
🏢 *Módulo:* ${reservation.aula_modulo}
📅 *Fecha:* ${reservation.fecha}
🕐 *Horario:* ${reservation.hora_inicio} - ${reservation.hora_fin}
👨‍🏫 *Instructor:* ${reservation.instructor_nombre}

Por favor, llegue puntualmente a su clase.
        `.trim()

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${reservation.grupo_whatsapp}`,
    })

    console.log("WhatsApp enviado exitosamente")
  } catch (error) {
    console.error("Error al enviar WhatsApp:", error)
    throw error
  }
}

module.exports = { sendWhatsAppNotification }
