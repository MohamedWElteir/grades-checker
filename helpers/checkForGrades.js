const { sendSMS, sendWhatsapp } = require("./messageSenderService");
const { extractGradesData } = require("./extractGradesData");
const { makeGetRequest } = require("./requestsHandler");
const { validatePage } = require("./validators");
const {
  saveUserProcess,
  getUserProcess,
  deleteUserProcess,
  getAllActiveProcesses,
} = require("./userListHandler");
const cron = require("node-cron");

cron.schedule("*/9 * * * *", async () => { // every 9 minutes
  console.log("Running grade update check...");
  const users = await getAllActiveProcesses();
  for (const user of users) {
    checkForUpdates(user);
  }
});

async function checkForUpdates(user) {
  try {
    const { username, phoneNumber, lastGradesData, token} = user;
    const newFetch = await makeGetRequest(token, "html");
    const valid = await validatePage(newFetch);
    if (!valid) {
      await deleteUserProcess(username);
      sendWhatsapp(phoneNumber, "Token expired. Session terminated. Restart with */start*").catch(
        console.error
      );
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
      sendSMS(phoneNumber, newGrades, extractedGradesData.CGPA).catch(
        console.error
      );
      await saveUserProcess(username, phoneNumber, extractedGradesData, token);
    }

    if (extractedGradesData.pendingCourses.length === 0) {
      sendSMS(
        phoneNumber,
        [{ message: "All grades revealed!" }],
        extractedGradesData.CGPA
      ).catch(console.error);
      await deleteUserProcess(username);
      sendWhatsapp(phoneNumber, "All grades revealed. Service stopped.").catch(
        console.error
      );
    }
  } catch (error) {
    console.error(
      `Error checking updates for ${user.username}:`,
      error.message
    );
  }
}
async function startBackgroundProcess(username, phoneNumber, token) {
 const existingProcess = await getUserProcess(username);
 if (existingProcess) return { status: 400, message: "User already has an active process" };

 try {
   const initialFetch = await makeGetRequest(token, "html");
   const valid = await validatePage(initialFetch);
   if (!valid) {
     return { status: 400, message: "Invalid or expired token." };
   }
   
   const initialGradesData = await extractGradesData(initialFetch, username);
   console.log("Initial grades data:", initialGradesData);
   await saveUserProcess(username, phoneNumber, initialGradesData, token);
  sendWhatsapp(
    phoneNumber,
    `You have successfully started the grade checking service. You will be notified when new grades are available via SMS, your pending courses are:\n ${initialGradesData.pendingCourses
      .map((course) => course.courseName)
      .join("\n")}\n Current CGPA: *${initialGradesData.CGPA}*`
  ).catch((err) => console.error("Error sending WhatsApp message:", err));

   return { status: 200, message: "Grade checking started" };
 } catch (error) {
   console.error(
     `Error starting background process for ${username}:`,
     error.message
   );
   return { status: 500, message: `Internal error: ${error.message}` };
 }
}



async function stopBackgroundProcess(username) { 
 const processInfo = await getUserProcess(username);
 if (!processInfo) return false;
  const runtime = new Date() - new Date(processInfo.startTime);
  const info = {
    runtime: `${Math.round(runtime / (1000 * 60))} minutes`,
    startTime: processInfo.startTime,
    endTime: new Date().toISOString(),
  };
    console.log(`Process statistics for ${username}:`, info);

     await deleteUserProcess(username);
    sendWhatsapp(
      processInfo.phoneNumber,
      `Grade checking service stopped. \ninfo: ${JSON.stringify(info)}`
    ).catch((err) => console.error("Error sending WhatsApp message:", err));
    return true;
  
  
}



module.exports = {
  startBackgroundProcess,
  stopBackgroundProcess,
  checkForUpdates,
};
