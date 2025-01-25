const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { sendSMS } = require("./sendSMS");
const { extractGradesData } = require("./extractGradesData");

const usersList = {};
const localPageTest = path.join(__dirname, "../data/debug_html_output.html");
async function startBackgroundProcess(username, phoneNumber, token) {
  if (usersList[username]) return false;
  
  const gradesPage = await makeGetRequest(token);
  const gradesData = extractGradesData(gradesPage, username);


  
}
async function startBackgroundProcessTest() {
  const username = "test";

  const localTest = fs.readFileSync(localPageTest, "utf-8");
  const gradesData = extractGradesData(localTest, username);

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
