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

async function getUserSession(username) {
  try {
    const session = await UserSession.findOne({ username });
    return session;
  } catch (error) {
    console.error("Error getting user session from MongoDB:", error.message);
    throw error;
  }
}

async function saveUserSession(username, sessionData) {
  try {
    await UserSession.updateOne(
      { username },
      {
        $set: {
          lastKnownGrades: sessionData.lastKnownGrades,
          notPolledCourses: sessionData.notPolledCourses,
          CGPA: sessionData.CGPA,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("Error saving user session to MongoDB:", error.message);
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
  getUserSession,
  saveUserSession,
};
