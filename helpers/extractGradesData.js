const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const cheerio = require("cheerio");

dotenv.config();

const userSessionsPath = path.join(__dirname, "../data/userSessions.json");

function readUserSessions() {
  if (!fs.existsSync(userSessionsPath)) {
    fs.writeFileSync(userSessionsPath, JSON.stringify({}), "utf-8");
  }
  let data = fs.readFileSync(userSessionsPath, "utf-8");

  if (data.trim() === "") data = "{}";

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Error parsing user sessions JSON:", error.message);
    
    fs.writeFileSync(userSessionsPath, JSON.stringify({}), "utf-8");
    return {};
  }
}

function writeUserSessions(sessions) {
  fs.writeFileSync(
    userSessionsPath,
    JSON.stringify(sessions, null, 2),
    "utf-8"
  );
}

async function extractGradesData(HTMLPageAsString, username) {
  const pendingCourses = [];
  const revealedGrades = [];
  const resultsProcessor = {
    matchedCount: 0,
    unmatchedCount: 0,
    incrementMatchedCount() {
      this.matchedCount++;
    },
    incrementUnmatchedCount() {
      this.unmatchedCount++;
    },
  };

  try {
    const labelPrefix = process.env.LABEL;
    if (!labelPrefix)
      throw new Error("LABEL is not defined in the environment variables.");

    const $ = cheerio.load(HTMLPageAsString);

    const tables = $(`table[id^="${labelPrefix}_GridView1_"]`);
    const numberOfTables = tables.length;
    console.log(`Found ${numberOfTables} tables`);

    if (numberOfTables === 0) console.warn("No grade tables found in the HTML content.");

    const lastTableIndex = numberOfTables - 1;

    const gridViewId = `${labelPrefix}_GridView1_${lastTableIndex}`;
    const semesterNameLabelId = `${labelPrefix}_SemesterNameLabel_${lastTableIndex}`; // semster name
    const formViewId = `${labelPrefix}_FormView1_${lastTableIndex}`; // final CGPA of the table
    

    const tableElement = $(`#${gridViewId}`);
    if (tableElement.length === 0) console.warn(`Table with id '${gridViewId}' not found.`);
    const collected = tableElement
      .text()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .reduce((acc, line) => {
        if (/^\d{9}/.test(line) || /^\d{9}/.test(line.replace(/\s+/g, " "))) {
          acc.push(line);
        } else if (acc.length > 0) {
          acc[acc.length - 1] += " " + line;
        }
        return acc;
      }, [])
      .map((record) => record.replace(/\s+/g, " ").trim());

     console.log(collected);
    for (let i = 0; i < collected.length; i++) {
      const record = collected[i];
      console.log(record);
      const parsedRow = parseRecord(record, resultsProcessor);
      if (parsedRow) {
         (parsedRow.grade === "P") ? pendingCourses.push(parsedRow): revealedGrades.push(parsedRow);
        }
      }
    

    const sessions = readUserSessions();
    const userSession = sessions[username] || { lastKnownGrades: [] };

    const newGrades = revealedGrades.filter((grade) => {
      return !userSession.lastKnownGrades.some(
        (g) => g.courseCode === grade.courseCode && g.grade === grade.grade
      );
    });

    sessions[username] = {
      lastKnownGrades: revealedGrades,
    };
    writeUserSessions(sessions);

    console.log(
      `Matched: ${resultsProcessor.matchedCount}, Unmatched: ${resultsProcessor.unmatchedCount}`
    );

    return {
      newGrades,
      pendingCourses,
    };
  } catch (error) {
    console.error(`Error extracting grades: ${error.message}`);
    throw error;
  }
}

function parseRecord(record, resultsProcessor) {
  const regex1 =
    /(^\d{9})([\u0600-\u06FF\s]+?)(?=\s*[^\s\d\u0600-\u06FF])\s+(.+?)\s+([A-D][+-]?|P|حذف|إستبيان|F)(\d\.\d{2})(\d)(\d\.\d{2})/;

  const regex2 =
    /(\d{9})\s+(\d{5})\s+(.+?)\s+([A-D][+-]?|P|حذف|إستبيان|F)(\d\.\d{2})(\d)(\d\.\d{2})/;

  let match = record.match(regex1);
  if (match) {
    try {
      const [
        _,
        courseCode,
        oldCourseCode,
        courseName,
        grade,
        points,
        hours,
        totalPoints,
      ] = match;
      resultsProcessor.incrementMatchedCount();
      return {
        courseCode: courseCode.trim(),
        oldCourseCode: oldCourseCode.trim(),
        courseName: courseName.trim(),
        grade,
        points: parseFloat(points),
        hours: parseInt(hours, 10),
        totalPoints: parseFloat(totalPoints),
      };
    } catch (e) {
      console.error(`Error parsing record: ${record} ${e.message}`);
    }
  } else {
    match = record.match(regex2);
    if (match) {
      try {
        const [
          _,
          courseCode,
          oldCourseCode,
          courseName,
          grade,
          points,
          hours,
          totalPoints,
        ] = match;
        resultsProcessor.incrementMatchedCount();
        return {
          courseCode: courseCode.trim(),
          oldCourseCode: oldCourseCode.trim(),
          courseName: courseName.trim(),
          grade,
          points: parseFloat(points),
          hours: parseInt(hours, 10),
          totalPoints: parseFloat(totalPoints),
        };
      } catch (e) {
        console.error(
          `Error parsing record with secondary regex: ${record} ${e.message}`
        );
        resultsProcessor.incrementUnmatchedCount();
      }
    } else {
      console.error(`No match found for record: ${record}`);
      resultsProcessor.incrementUnmatchedCount();
    }
  }
  return null;
}

module.exports = {
  extractGradesData,
};
