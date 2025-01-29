const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 3000;

const {
  startBackgroundProcess,
  stopBackgroundProcess,
  updateInterval,
  getInterval,
} = require("./helpers/checkForGrades");


app.use(express.json());


app.post("/start", async (req, res) => {
  const { username, phoneNumber, token } = req.body;


  if (!username || !phoneNumber || !token) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  
  const val = await startBackgroundProcess(username, phoneNumber, token);
  res.status(val.status).json(val.message);
});


app.delete("/end", async (req, res) => {
  const { username } = req.body;


  const stopped = await stopBackgroundProcess(username);
  stopped ? res.json({ message: `Grade checking stopped for user: ${username}` }): res.status(404).json({ error: "No active process for this user" });
  
});

app.put("/update-interval", async (req, res) => {
  const { username, interval } = req.body;

  if (!username || !interval) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const val = await updateInterval(username, interval);
  res.status(val.status).json(val.message);
});

app.get("/get-interval", async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const val = await getInterval(username);
  res.status(val.status).json(val.message);
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

