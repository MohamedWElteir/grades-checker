const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  phoneNumber: String,
  lastGradesData: Object,
  token: String,
  startTime: Date,
});
module.exports = mongoose.model("UserProcess", userSchema);
