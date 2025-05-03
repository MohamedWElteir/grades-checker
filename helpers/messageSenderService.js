const twilio = require("twilio");
const dotenv = require("dotenv");
dotenv.config();
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(to, grades, CGPA) {
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
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log(`SMS sent to ${to}: ${message.sid}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error);
  }
}



async function sendGradesViaWhatsapp(to, grades, CGPA) {
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
      from: process.env.TWILIO_WHATSAPP_PHONE_NUMBER,
      to: `whatsapp:${to}`,
    });
    console.log(`WhatsApp message sent to ${to}: ${message.sid}`);
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${to}:`, error);
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
  sendSMS,
  sendGradesViaWhatsapp,
  sendWhatsapp,
};
