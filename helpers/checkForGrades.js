const path = require("path");
const axios = require("axios");
const { sendSMS, sendWhatsapp } = require("./messageSenderService");
const { extractGradesData } = require("./extractGradesData");
const { makeGetRequest } = require("./requestsHandler");
const { validatePage } = require("./validators");


const usersList = {};
const logPath = path.join(__dirname, "../data/log.txt");

async function startBackgroundProcess(username, phoneNumber, token) {
  if (usersList[username]) return { status: 400, message: "User already has an active process" };
  try {
    const initialFetch = await makeGetRequest(token, 'html');
    const valid = await validatePage(initialFetch);
    if (!valid) {
      return { status: 400, message: "Invalid or expired token. Please try again." };
    }
    const initialGradesData = await extractGradesData(initialFetch, username);
    // console.log(initialGradesData);
    usersList[username] = {
      phoneNumber,
      lastGradesData: initialGradesData || [],
      timeout: null,
      startTime: new Date().toISOString(),
    };
     sendWhatsapp(
       phoneNumber,
       `You have successfully started the grade checking service. You will be notified when new grades are available via SMS, here is your current CGPA: *${initialGradesData.CGPA}*`
     ).catch((err) => console.error("Error sending WhatsApp message:", err));
    const checkForUpdates = async () => {
      try {
        // console.log(`Checking for updates for ${username}...`);
        const newFetch = await makeGetRequest(token, 'html');
        const valid = await validatePage(newFetch);
        if (!valid) {
          stopBackgroundProcess(username);
           sendWhatsapp(
             phoneNumber,
             "Token has expired and your session has been terminated. Reuse the service by calling the /start endpoint."
           ).catch((err) =>
             console.error("Error sending WhatsApp message:", err)
           );
          return { status: 400, message: "Token expired." };
        }
        const extractedGradesData = await extractGradesData(newFetch, username);
        const lastGradesData = usersList[username].lastGradesData;

        const newGrades = extractedGradesData.newGrades.filter((grade) => {
          return !lastGradesData.lastKnownGrades.some(
            (g) => g.courseCode === grade.courseCode && g.grade === grade.grade
          );
        });
        const CGPA = extractedGradesData.CGPA || "N/A";
        if (newGrades.length > 0) {
          sendSMS(phoneNumber, newGrades, CGPA).catch((err) =>
            console.error("Error sending SMS notification:", err)
          );
          usersList[username].lastGradesData.lastKnownGrades =
            extractedGradesData.lastKnownGrades;
          usersList[username].lastGradesData.CGPA = CGPA;

        }

        if (extractedGradesData.pendingCourses.length === 0) {
           sendSMS(
            phoneNumber,
            [{ message: "All your grades have been revealed!" }],
            CGPA
           ).catch((err) =>
             console.error("Error sending SMS notification:", err)
            );

        const stopped = await stopBackgroundProcess(username);
         if(stopped) {
           sendWhatsapp(
             phoneNumber,
             "All grades have been revealed. Grade checking has been stopped."
           ).catch((err) =>
             console.error("Error sending WhatsApp message:", err)
           );
           console.log(`Background process stopped for ${username}`);
         }
        }
      } catch (error) {
        console.error(`Error checking updates for ${username}:`, error.message);
      }
    };

    const timeout = setTimeout(checkForUpdates, 7 * 60 * 1000); // 7 minutes
    usersList[username].timeout = timeout;

    return { status: 200, message: "Grade checking started" };
  } catch (error) {
    console.error(
      `Error starting background process for ${username}:`,
      error.message
    );
    return false;
  }
}



async function stopBackgroundProcess(username) { 
  const processInfo = usersList[username];
  if (!processInfo) return false;
    clearInterval(processInfo.timeout);
    const runtime = new Date() - new Date(processInfo.startTime);
    console.log(`Process statistics for ${username}:`, {
      runtime: `${Math.round(runtime / (1000 * 60))} minutes`,
      startTime: processInfo.startTime,
      endTime: new Date().toISOString(),
    });

    delete usersList[username];
    sendWhatsapp(
      processInfo.phoneNumber,
      "Grade checking service has been stopped."
    ).catch((err) => console.error("Error sending WhatsApp message:", err));
    return true;
  
  
}


async function updateTimeout(username, timeout) {
  const processInfo = usersList[username];
  if (!processInfo) return { status: 404, message: "No active process for this user" };
  clearInterval(processInfo.timeout);
  const newTimeout = setTimeout(() => {
    stopBackgroundProcess(username);
  }, timeout * 60 * 1000);
  processInfo.timeout = newTimeout;
  return { status: 200, message: `Timeout updated to ${timeout} minutes` };
}

async function getTimeout(username) {
  const processInfo = usersList[username];
  if (!processInfo) return { status: 404, message: "No active process for this user" };
  return { status: 200, message: `Timeout for ${username}: ${processInfo.timeout}` };
}

module.exports = {
  startBackgroundProcess,
  stopBackgroundProcess,
  updateTimeout,
  getTimeout,
};
