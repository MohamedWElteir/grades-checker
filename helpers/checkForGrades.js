const {
  sendMessage,
  sendWhatsapp,
} = require("./messageSenderService");
const { extractGradesData } = require("./extractGradesData");
const { makeGetRequest } = require("./requestsHandler");
const { validatePage } = require("./validators");
const {
  saveUserProcess,
  getUserProcess,
  getAllActiveProcesses,
  deleteAllUserInstance,
  isTokenInUse,
} = require("./userListHandler");
const cron = require("node-cron");

cron.schedule("*/9 * * * *", async () => { // every 9 minutes
  console.log("Running grade update check...");
  const users = await getAllActiveProcesses();
  if (!users || users.length === 0)
    return console.log("No active processes found.");
  console.log(`Running checks for ${users.length} active processes.`);
  for (const user of users) checkForUpdates(user);
});

async function checkForUpdates(user) {
  try {
    const { username, phoneNumber, lastGradesData, token } = user;
    const newFetch = await makeGetRequest(token, "html");
    const valid = await validatePage(newFetch);
    if (!valid) {
      await deleteAllUserInstance(username);
      sendWhatsapp(
        phoneNumber,
        "Token expired. Session terminated. Restart with /start"
      ).catch(console.error);
      return;
    }

    const extractedGradesData = await extractGradesData(newFetch, username);
    const newGrades = extractedGradesData.newGrades.filter(
      (grade) =>
        !lastGradesData?.lastKnownGrades?.some(
          (g) => g.courseCode === grade.courseCode && g.grade === grade.grade
        )
    );

    if (newGrades.length > 0) {
      sendMessage(phoneNumber, newGrades, extractedGradesData.CGPA).catch(
        console.error
      );
      sendMessage(phoneNumber, newGrades, extractedGradesData.CGPA, 'WhatsApp').catch(
        console.error
      );
      await saveUserProcess(username, phoneNumber, extractedGradesData, token);
    }

    if (extractedGradesData.pendingCourses.length === 0) {
      await deleteAllUserInstance(username);
      sendWhatsapp(
        phoneNumber,
        `All grades revealed. Service stopped. Thank you for using the service.\n*CGPA:* ${extractedGradesData.CGPA}.`
      ).catch(console.error);
    }
  } catch (error) {
    console.error(
      `Error checking updates for ${user.username}:`,
      error.message
    );
  }
}
async function startBackgroundProcess(username, phoneNumber, token) {

  if (await getUserProcess(username)) return { status: 400, message: "User already has an active process" };
  if (await isTokenInUse(token)) return { status: 400, message: "Token already in use" };


  try {
    const initialFetch = await makeGetRequest(token, "html");
    const valid = await validatePage(initialFetch);
    if (!valid) return { status: 400, message: "Invalid or expired token." };

    const initialGradesData = await extractGradesData(initialFetch, username);
    if (initialGradesData.pendingCourses.length === 0)
      return { status: 400, message: "No pending courses." };

    console.log("Initial grades data:", initialGradesData);
    await saveUserProcess(username, phoneNumber, initialGradesData, token);
    sendWhatsapp(
      phoneNumber,
      `You have successfully started the grade checking service. You will be notified when new grades are available via SMS.\n*Your username:* *${username}*\n*Your pending courses are:*\n ${initialGradesData.pendingCourses
        .map((course) => `- ${course.courseName}`)
        .join("\n")}\n*Your current CGPA:* *${initialGradesData.CGPA}*`
    ).catch((err) => console.error("Error sending WhatsApp message:", err));

    if (initialGradesData.notPolledCourses.length > 0) {
      sendWhatsapp(
        phoneNumber,
        `You have ${
          initialGradesData.notPolledCourses.length
        } courses that are not polled yet:\n ${initialGradesData.notPolledCourses
          .map((course) => `- ${course.courseName}`)
          .join("\n")}`
      ).catch((err) => console.error("Error sending WhatsApp message:", err));
    }

    return { status: 201, message: "Grade checking service started" };
  } catch (error) {
    console.error(
      `Error starting background process for ${username}:`,
      error.message
    );
    return { status: 500, message: `Internal error: ${error.message}` };
  }
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(date));
};

async function stopBackgroundProcess(username) {
  const processInfo = await getUserProcess(username);
  if (!processInfo) return false;
  const runtime = new Date() - new Date(processInfo.startTime);
  const info = {
    runtime: `${Math.round(runtime / (1000 * 60))} minutes`,
    startTime: formatDate(processInfo.startTime),
    endTime: formatDate(new Date()),
  };
  console.log(`Process statistics for ${username}:`, info);

  await deleteAllUserInstance(username);
  sendWhatsapp(
    processInfo.phoneNumber,
    `Grade checking service has been stopped. \nInfo:\n${Object.entries(info)
      .map(([key, value]) => `*${key}*: ${value}`)
      .join("\n")}`
  ).catch((err) => console.error("Error sending WhatsApp message:", err));
  return true;
}

module.exports = {
  startBackgroundProcess,
  stopBackgroundProcess,
  checkForUpdates,
};
