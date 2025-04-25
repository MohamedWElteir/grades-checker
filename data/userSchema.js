const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  lastGradesData: Object,
  token: { type: String, unique: true },
  startTime: Date,
});
module.exports = mongoose.model("UserProcess", userSchema);
