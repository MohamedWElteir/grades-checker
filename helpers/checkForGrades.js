const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { sendSMS } = require("./sendSMS");
const { extractGradesData } = require("./extractGradesData");
const { log } = require("console");

const usersList = {};
const localPageTest = path.join(__dirname, "../data/debug_html_output.html");
async function startBackgroundProcess(username, phoneNumber, token) {
  if (usersList[username]) return false;
   try {
    
     const gradesPage = await makeGetRequest(token);
     const initialGradesData = await extractGradesData(gradesPage, username);

     usersList[username] = {
       phoneNumber,
       token,
       lastGradesData: initialGradesData,
       interval: null,
     };
     const checkForUpdates = async () => {
       try {
         console.log(`Checking for updates for ${username}...`);
         const gradesPage = await makeGetRequest(token);
         const newGradesData = await extractGradesData(gradesPage, username);

         const lastGradesData = usersList[username].lastGradesData;

         
         const newGrades = newGradesData.newGrades.filter((grade) => {
           return !lastGradesData.lastKnownGrades.some(
             (g) => g.courseCode === grade.courseCode && g.grade === grade.grade
           );
         });

         if (newGrades.length > 0) {
           console.log(`New grades found for ${username}:`, newGrades);

           
           await sendSMS(phoneNumber, newGrades);
           console.log(`SMS notification sent to ${phoneNumber}`);

          
           usersList[username].lastGradesData.lastKnownGrades =
             newGradesData.lastKnownGrades;
         }

        
         if (newGradesData.pendingCourses.length === 0) {
           console.log(`All grades have been revealed for ${username}`);

          
           await sendSMS(phoneNumber, [
             { message: "All your grades have been revealed!" },
           ]);

          
           clearInterval(usersList[username].interval);
           delete usersList[username];
           console.log(`Background process stopped for ${username}`);
         }
       } catch (error) {
         console.error(
           `Error checking updates for ${username}:`,
           error.message
         );
       }
     };

    
     const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
     usersList[username].interval = interval;

    
     return true;
   } catch (error) {
     console.error(
       `Error starting background process for ${username}:`,
       error.message
     );
     return false;
   }

  
}
async function startBackgroundProcessTest() {
  const username = "test";
  const phoneNumber = process.env.TEST_PHONE_NUMBER;

  try {
    const localTest = fs.readFileSync(localPageTest, "utf-8");
  const gradesData = extractGradesData(localTest, username);
  log(gradesData)
   usersList[username] = {
       phoneNumber,
       lastGradesData: gradesData,
       interval: null,
     };
     const checkForUpdates = async () => {
       try {
         console.log(`Checking for updates for ${username}...`);
         const localTest = fs.readFileSync(localPageTest, "utf-8");
         const newGradesData = await extractGradesData(localTest, username);

         const lastGradesData = usersList[username].lastGradesData;

          if (!Array.isArray(lastGradesData.lastKnownGrades)) {
            console.warn(`lastKnownGrades is undefined for user ${username}`);
            lastGradesData.lastKnownGrades = [];
          }
         const newGrades = newGradesData.newGrades.filter((grade) => {
           return !lastGradesData.lastKnownGrades.some(
             (g) => g.courseCode === grade.courseCode && g.grade === grade.grade
           );
         });

         if (newGrades.length > 0) {
           console.log(`New grades found for ${username}:`, newGrades);

           
           await sendSMS(phoneNumber, newGrades);
           console.log(`SMS notification sent to ${phoneNumber}`);

          
           usersList[username].lastGradesData.lastKnownGrades =
             newGradesData.lastKnownGrades;
         }

        
         if (newGradesData.pendingCourses.length === 0) {
           console.log(`All grades have been revealed for ${username}`);

          
           await sendSMS(phoneNumber, [
             { message: "All your grades have been revealed!" },
           ]);

          
           stopBackgroundProcess(username)
           console.log(`Background process stopped for ${username}`);
         }
       } catch (error) {
         console.error(
           `Error checking updates for ${username}:`,
           error.message
         );
       }
     };

    
     const interval = setInterval(checkForUpdates, 25 * 1000);
     usersList[username].interval = interval;
     console.log(usersList)
    
     return true;
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
    await processInfo.browser.close();

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



function formatGradeInfo(grade) {
  return {
    course: grade.courseName,
    code: grade.courseCode,
    grade: grade.grade,
    timestamp: new Date().toISOString(),
  };
}

async function makeGetRequest(token){
  try {
    const url = `https://www.scialex.org/F/${token}/2018/Student/Results.aspx`;
    console.log(`Making get request to ${url}`);
    
    const response = await axios({
      method: 'get',
      url: url,
      headers: {
        'Cookie': "__RequestVerificationToken=T11HaxdI7gYMtXLATw_X0khHCb12SVwGKPOMcZtNW5SVYJyDTRpwMCMUfaQ0rUov71H7O5j8Ys70gCxvObCrASO9i5Ei_F1NcnuTgaGddvE1; ASP.NET_SessionId=ze0v2j0qmbp0ft2vseubruat; cf_clearance=d3bOYzRQwuojNlBhMLDvkYh7sOQLD0SXqpeaJhYa26o-1737452615-1.2.1.1-hOOZpIeAPQ9mt9y36Tyg7hxRWYNM.1MSEKlkssx0meEbLkXH3BQnt3IfxUzXfNd31auAuVWUqYj.aN5gIa7Ba1aplXW6TWDjV2i6srKQq7KKXn2mhJQUKlUUCyfszEJGHDUhm0tkhBAleGbwyc02VWeYIDzr9xx_QNTU_0o5PFw.rnsCXO7kPyoNLkISrj7nAuBUpEIW9wHsokRlMDEyY1Z1nIbBIrnT70_8WlTW2NE61Azga2IHLIFri.rDieLwQDML3MK6qtlk3gJvhvrVgiOatOqq__V.kRz3ZSSi9gw",
        'Accept': 'text,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Host': 'www.scialex.org',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      responseType: 'text',
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });

    
    if (response.status === 200) {
      if (!response.data) {
        throw new Error('Response is empty');
      }
      return response.data;
    }
  }
  catch (error) {
    console.error(`Failed to make get request:`, error);
  }}

module.exports = {
  startBackgroundProcess,
  startBackgroundProcessTest,
  stopBackgroundProcess,
  makeGetRequest,
};
