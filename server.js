const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 3000;

const {
  startBackgroundProcess,
  stopBackgroundProcess,
} = require("./helpers/checkForGrades");

const {validateFields} = require("./middlewares/validateFields");

app.use(express.json());


app.post("/start", validateFields(["username", "phoneNumber", "token"]), async (req, res) => {
  const { username, phoneNumber, token } = req.body;

    const val = await startBackgroundProcess(username, phoneNumber, token);
  res.status(val.status).json({
    message: val.message
  });
});


app.delete("/end", validateFields(["username"]), async (req, res) => {
  const { username } = req.body;
  const stopped = await stopBackgroundProcess(username);
  stopped
    ? res.json({
      message: `Grade checking stopped for user: ${username}`
    })
    : res.status(404).json({
      error: "No active process for this user"
    });
});



app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

