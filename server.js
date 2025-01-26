const express = require("express");
const exec = require("child_process").exec;
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 3000;

const {
  startBackgroundProcess,
  startBackgroundProcessTest,
  stopBackgroundProcess,
} = require("./helpers/checkForGrades");

app.use(express.json());


app.post("/start", async (req, res) => {
  const { username, phoneNumber, token } = req.body;


  if (!username || !phoneNumber || !token) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  
  const can = startBackgroundProcess(username, phoneNumber, token);
  can ? res.json({ message: `Grade checking started for user: ${username}` }) : res.status(404).json({ error: "User already has an active process" });
});


app.post("/end", async (req, res) => {
  const { username } = req.body;


  const stopped = await stopBackgroundProcess(username);
  if (stopped) {
    res.json({ message: `Grade checking stopped for user: ${username}` });
  } else {
    res.status(404).json({ error: "No active process for this user" });
  }
});

app.get("/test", async (req, res) => {
 const can = startBackgroundProcessTest();
  can ? res.json({ message: `Grade checking started for user: test` }) : res.status(404).json({ error: "User already has an active process" });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);


 exec("curl -X GET http://localhost:3000/test", (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
  });


});

