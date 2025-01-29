const { getAllActiveProcesses } = require("../helpers/userListHandler");
const { checkForUpdates } = require("../helpers/checkForGrades");

module.exports = async (req, res) => {
  console.log("Running scheduled grade update check...");
  try {
    const users = await getAllActiveProcesses();
    for (const user of users) {
      await checkForUpdates(user);
    }
    res.status(200).json({ message: "Grade check completed." });
  } catch (error) {
    console.error("Error checking grades:", error.message);
    res.status(500).json({ error: error.message });
  }
};
