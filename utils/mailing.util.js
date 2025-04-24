import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
const { MAILERSEND_API_KEY } = process.env;

// Inicializar MailerSend con la clave API
const mailerSend = new MailerSend({
  apiKey: MAILERSEND_API_KEY,
});

// Función para enviar correo electrónico
async function sendEmail(data) {
  const sentFrom = new Sender('hola@dringo.com.mx', 'Dringo Night Delivery');
  const recipients = [new Recipient(data.to, data.name ? data.name : 'Dringo Mx')];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(data.subject)
    .setHtml(data.template);

  try {
    await mailerSend.email.send(emailParams);
    console.log('Correo electrónico enviado exitosamente.');
  } catch (error) {
    console.error('Error al enviar el correo electrónico:', error);
    throw error;
  }
}

export default sendEmail;