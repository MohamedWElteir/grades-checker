const twilio = require("twilio");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(to, grades, CGPA) {
  const messageBody = grades
    .map((grade) => `Course: ${grade.courseName}, Grade: ${grade.grade}, CGPA: ${CGPA}`)
    .join("\n");

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

module.exports = {
  sendSMS,
};
