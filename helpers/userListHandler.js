const UserProcess = require("../data/userSchema");
const UserSchema = require("../data/userSessionSchema");
async function saveUserProcess(username, phoneNumber, lastGradesData, token) {
  if (typeof username !== "string") {
    throw new Error("Invalid username: must be a string.");
  }
  if (typeof phoneNumber !== "string") {
    throw new Error("Invalid phoneNumber: must be a string.");
  }
  if (typeof token !== "string") {
    throw new Error("Invalid token: must be a string.");
  }
  if (typeof lastGradesData !== "object" || lastGradesData === null) {
    throw new Error("Invalid lastGradesData: must be a non-null object.");
  }
  await UserProcess.findOneAndUpdate(
    { username: { $eq: username } },
    {
      $set: {
        phoneNumber,
        startTime: new Date(),
        lastGradesData,
        token,
      },
    },
    { upsert: true }
  );
}

async function getAllActiveProcesses() {
  return await UserProcess.find({});
}

async function getUserProcess(username) {
  return await UserProcess.findOne({ username: { $eq: username } });
}

async function deleteUserProcess(username) {
  return await UserProcess.deleteOne({ username: { $eq: username } });
}

async function deleteUserSession(username) {
  return await UserSchema.deleteOne({ username: { $eq: username } });
}

async function deleteAllUserInstance(username) {
  await deleteUserProcess(username);
  await deleteUserSession(username);
}

async function isTokenInUse(token) {
  const user = await UserProcess.findOne({ token: { $eq: token } });
  return !!user;
}

module.exports = {
  saveUserProcess,
  getUserProcess,
  deleteUserProcess,
  getAllActiveProcesses,
  deleteUserSession,
  deleteAllUserInstance,
  isTokenInUse,
};
