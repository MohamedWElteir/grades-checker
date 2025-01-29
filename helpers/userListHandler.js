const UserProcess = require("../data/userSession");

async function saveUserProcess(username, phoneNumber, lastGradesData) {
  await UserProcess.findOneAndUpdate(
    { username },
    { phoneNumber, startTime: new Date(), lastGradesData },
    { upsert: true }
  );
}

async function getUserProcess(username) {
  return await UserProcess.findOne({ username });
}

async function deleteUserProcess(username) {
  return await UserProcess.deleteOne({ username });
}

module.exports = {
  saveUserProcess,
  getUserProcess,
  deleteUserProcess,
};