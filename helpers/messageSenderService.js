const twilio = require("twilio");
const dotenv = require("dotenv");
dotenv.config();
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendMessage(to, grades, CGPA , senderMethod = 'SMS') {
  let messageBody = grades
    .map(
      (grade) =>
        `Course: ${grade.courseName}\nGrade: ${grade.grade}`
    )
    .join("\n");
  messageBody += `\n*CGPA:* ${CGPA}`;
  try {
    const message = await twilioClient.messages.create({
      body: `New grades available:\n${messageBody}`,
      from:
        senderMethod.toLowerCase() === "whatsapp"
          ? process.env.TWILIO_WHATSAPP_PHONE_NUMBER
          : process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log(`Message sent to ${to} via ${senderMethod.toLowerCase() === "whatsapp" ? "WhatsApp" : "SMS"}: ${message.sid}`);
  } catch (error) {
    console.error(`Failed to send message to ${to} via ${senderMethod.toLowerCase() === "whatsapp" ? "WhatsApp" : "SMS"}:`, error);
  }
}



async function sendWhatsapp(to, messageParams) {
  const messageBeginning =
    "*Hey there! This is the WhatsApp bot of the grades checker API!* \n";
  const finalMessage = messageBeginning + messageParams;
  try {
    const message = await twilioClient.messages.create({
      body: finalMessage,
      from: process.env.TWILIO_WHATSAPP_PHONE_NUMBER,
      to: `whatsapp:${to}`,
    });
    console.log(`WhatsApp message sent to ${to}: ${message.sid}`);
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${to}:`, error);
  }
}

module.exports = {
  sendMessage,
  sendWhatsapp,
};
