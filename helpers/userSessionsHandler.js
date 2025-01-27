const fs = require("fs").promises;
const path = require("path");
const userSessionsPath = path.join(__dirname, "../data/userSessions.json");


async function readUserSessions() {
  try {
    await fs.access(userSessionsPath);
  } catch (error) {
    await fs.writeFile(userSessionsPath, JSON.stringify({}), "utf-8");
  }
  let data = await fs.readFile(userSessionsPath, "utf-8");

  if (data.trim() === "") data = "{}";

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Error parsing user sessions JSON:", error.message);

    await fs.writeFile(userSessionsPath, JSON.stringify({}), "utf-8");
    return {};
  }
}

async function writeUserSessions(sessions) {
  await fs.writeFile(
    userSessionsPath,
    JSON.stringify(sessions, null, 2),
    "utf-8"
  );
}

module.exports = {
  readUserSessions,
  writeUserSessions,
};
