const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    lastKnownGrades: [
      {
        courseCode: String,
        oldCourseCode: String,
        courseName: String,
        grade: String,
        points: Number,
        hours: Number,
        totalPoints: Number,
      },
    ],
    CGPA: { type: String },
  },
  { timestamps: true }
);


module.exports = mongoose.model("UserSession", userSessionSchema);
