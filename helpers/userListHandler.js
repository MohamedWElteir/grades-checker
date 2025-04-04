const UserProcess = require("../data/userSchema");

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



module.exports = {
  saveUserProcess,
  getUserProcess,
  deleteUserProcess,
  getAllActiveProcesses,
};