const UserProcess = require("../data/userSchema");
const UserSchema = require("../data/userSessionSchema");
async function saveUserProcess(username, phoneNumber, lastGradesData, token) {
  await UserProcess.findOneAndUpdate(
    { username },
    { phoneNumber, startTime: new Date(), lastGradesData, token },
    { upsert: true }
  );
}

async function getAllActiveProcesses() {
  return await UserProcess.find({});
}

async function getUserProcess(username) {
  return await UserProcess.findOne({ username });
}

async function deleteUserProcess(username) {
  return await UserProcess.deleteOne({ username });
}

async function deleteUserSeccion(username) {
  return await UserSchema.deleteOne({ username });
}

async function deleteAllUserInstance(username) {
  await deleteUserProcess(username);
  await deleteUserSeccion(username);
}

module.exports = {
  saveUserProcess,
  getUserProcess,
  deleteUserProcess,
  getAllActiveProcesses,
  deleteUserSeccion,
  deleteAllUserInstance,
};