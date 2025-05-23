const connectDB = require("../data/db");
const {
  getUserSession,
  saveUserSession,
} = require("./userSessionsHandler");

connectDB();

async function extractGradesData($, username) {
  const pendingCourses = [];
  const revealedGrades = [];
  const notPolledCourses = [];
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
    const labelPrefix = "ContentPlaceHolder1_ContentPlaceHolder1_DataList1";

    const tables = $(`table[id^="${labelPrefix}_GridView1_"]`);
    const numberOfTables = tables.length;

    if (numberOfTables === 0)
      throw new Error("No grade tables found in the HTML content.");

    const lastTableIndex = numberOfTables - 1;
    const gridViewId = `${labelPrefix}_GridView1_${lastTableIndex}`; // Most recent courses table
    const formViewId = `${labelPrefix}_FormView1_${lastTableIndex}_CGPALabel`; // Corresponding CGPA on that same table
    const CGPA = $(`#${formViewId}`).text().trim();
    const tableElement = $(`#${gridViewId}`);
    if (tableElement.length === 0)
      throw new Error(`Table with id '${gridViewId}' not found.`);
    
    const records = processTableElement(tableElement);
    for (const record of records) {
      const parsedRow = parseRecord(record, resultsProcessor);
      if (parsedRow) {
        switch (parsedRow.grade) {
          case "P":
            pendingCourses.push(parsedRow);
            break;
          case "إستبيان":
            notPolledCourses.push(parsedRow);
            break;
          default:
            revealedGrades.push(parsedRow);
        }
      }
    }

    const session = await getUserSession(username);
    let userSession = session || {
      lastKnownGrades: [],
      notPolledCourses: [],
    };

    const newGrades = revealedGrades.filter((grade) => {
      return !userSession.lastKnownGrades.some(
        (g) => g.courseCode === grade.courseCode && g.grade === grade.grade
      );
    });

    if (newGrades.length > 0) {
      userSession = {
        lastKnownGrades: revealedGrades,
        notPolledCourses: notPolledCourses.length > 0 ? notPolledCourses : [],

        CGPA: CGPA,
      };
    }
    await saveUserSession(username, userSession);

    console.log(
      `Matched: ${resultsProcessor.matchedCount}, Unmatched: ${resultsProcessor.unmatchedCount}`
    );

    return {
      newGrades,
      pendingCourses,
      lastKnownGrades: revealedGrades,
      notPolledCourses,
      CGPA,
    };
  } catch (error) {
    console.error(`Error extracting grades: ${error.message}`);
    throw error;
  }
}

function parseRecord(record, resultsProcessor) {
  const regex1 =
    /(\d{9})\s+(\d{5})\s+(.+?)\s+([A-D][+-]?|P|حذف|إستبيان|F|W|I)\s+(\d\.\d{2})\s+(\d+)\s+(\d+\.\d{2})/;

  const regex2 =
    /(\d{9})\s+((?:\S+\s*){1,3})\s+(.+?)\s+([A-D][+-]?|P|حذف|إستبيان|F|W|I)\s+(\d\.\d{2})\s+(\d+)\s+(\d\.\d{2})/;
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

function processTableElement(tableElement) {
  const lines = tableElement
    .text()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.includes("رقم المقرر"));

  const records = [];
  let i = 0;

  while (i < lines.length) {
    let recordLines = [];
    let line = lines[i];

    if (/^\d{9}/.test(line)) {
      recordLines.push(line);
      i++;

      while (i < lines.length && !/^\d{9}/.test(lines[i]))
        recordLines.push(lines[i++]);
      let record = recordLines.join(" ").trim();
      record = record.replace(/(\d{9})(\d{5}|\D+)/, "$1 $2");

      record = record.replace(
        /([A-D][+-]?|P|حذف|إستبيان|F|W|I)(\d\.\d{2})(\d+)(\d+\.\d{2})/,
        "$1 $2 $3 $4"
      );
      record = record.replace(/\s+/g, " ").trim();

      records.push(record);
    } else {
      i++;
    }
  }

  return records;
}

module.exports = {
  extractGradesData,
};
