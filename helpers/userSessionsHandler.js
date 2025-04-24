const UserSession = require("../data/userSessionSchema");

async function readUserSessions() {
  try {
    const userSessions = await UserSession.find();
    const sessions = {};
    userSessions.forEach((session) => {
      sessions[session.username] = {
        lastKnownGrades: session.lastKnownGrades,
        notPolledCourses: session.notPolledCourses,
        CGPA: session.CGPA,
      };
    });
    return sessions;
  } catch (error) {
    console.error("Error reading user sessions from MongoDB:", error.message);
    throw error;
  }
}

async function writeUserSessions(sessions) {
  try {
    for (const username in sessions) {
      const session = sessions[username];
      await UserSession.updateOne(
        { username },
        {
          $set: {
            lastKnownGrades: session.lastKnownGrades,
            notPolledCourses: session.notPolledCourses,
            CGPA: session.CGPA,
          },
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error("Error writing user sessions to MongoDB:", error.message);
    throw error;
  }
}

module.exports = {
  readUserSessions,
  writeUserSessions,
};
