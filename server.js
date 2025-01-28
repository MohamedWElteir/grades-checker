const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 3000;

const {
  startBackgroundProcess,
  stopBackgroundProcess,
} = require("./helpers/checkForGrades");

app.use(express.json());


app.post("/start", async (req, res) => {
  const { username, phoneNumber, token } = req.body;


  if (!username || !phoneNumber || !token) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  
  const val = await startBackgroundProcess(username, phoneNumber, token);
  res.status(val.status).json(val);
});


app.post("/end", async (req, res) => {
  const { username } = req.body;


  const stopped = await stopBackgroundProcess(username);
  stopped ? res.json({ message: `Grade checking stopped for user: ${username}` }): res.status(404).json({ error: "No active process for this user" });
  
});



app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

