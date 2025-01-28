const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { sendSMS, sendWhatsapp } = require("./messageSenderService");
const { extractGradesData } = require("./extractGradesData");
const { makeGetRequest } = require("./requestsHandler");
const { validatePage } = require("./validators");
const { log } = require("console");

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
    log(initialGradesData);
    usersList[username] = {
      phoneNumber,
      lastGradesData: initialGradesData,
      interval: null,
      startTime: new Date().toISOString(),
    };
    const checkForUpdates = async () => {
      try {
        console.log(`Checking for updates for ${username}...`);
        const newFetch = await makeGetRequest(token, 'html');
        const valid = await validatePage(newFetch);
        if (!valid) {
          await stopBackgroundProcess(username);
          await sendWhatsapp(phoneNumber, "Token has expired and your session has been terminated. Reuse the service by calling the /start endpoint.");
          return { status: 400, message: "Token expired." };
        }
        const extractedGradesData = await extractGradesData(newFetch, username);
        const lastGradesData = usersList[username].lastGradesData;

        if (!Array.isArray(lastGradesData.lastKnownGrades)) {
          console.warn(`lastKnownGrades is undefined for user ${username}`);
          lastGradesData.lastKnownGrades = [];
        }
        const newGrades = extractedGradesData.newGrades.filter((grade) => {
          return !lastGradesData.lastKnownGrades.some(
            (g) => g.courseCode === grade.courseCode && g.grade === grade.grade
          );
        });
        const CGPA = extractedGradesData.CGPA || "N/A";
        if (newGrades.length > 0) {
          console.log(`New grades found for ${username}:`, newGrades);

          await sendSMS(phoneNumber, newGrades, CGPA);
          console.log(`SMS notification sent to ${phoneNumber}`);

          usersList[username].lastGradesData.lastKnownGrades =
            extractedGradesData.lastKnownGrades;
          
          const logData = {
            username,
            newGrades,
            CGPA,
            timestamp: new Date().toISOString(),
          };
         fs.appendFile(logPath, JSON.stringify(logData) + "\n");
        }

        if (extractedGradesData.pendingCourses.length === 0) {
          console.log(`All grades have been revealed for ${username}`);

          await sendSMS(
            phoneNumber,
            [{ message: "All your grades have been revealed!" }],
            CGPA
          );

         await stopBackgroundProcess(username);
          console.log(`Background process stopped for ${username}`);
        }
      } catch (error) {
        console.error(`Error checking updates for ${username}:`, error.message);
      }
    };

    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    usersList[username].interval = interval;
    console.log(usersList);

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
  if (processInfo) {
    clearInterval(processInfo.interval);
    const runtime = new Date() - new Date(processInfo.startTime);
    console.log(`Process statistics for ${username}:`, {
      runtime: `${Math.round(runtime / (1000 * 60))} minutes`,
      startTime: processInfo.startTime,
      endTime: new Date().toISOString(),
    });

    delete usersList[username];
    return true;
  }
  return false;
}





module.exports = {
  startBackgroundProcess,
  stopBackgroundProcess,
};
