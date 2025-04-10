const express = require("express");
const app = express();
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const marked = require("marked");
dotenv.config();
const PORT = process.env.PORT || 3000;

const {
  startBackgroundProcess,
  stopBackgroundProcess,
} = require("./helpers/checkForGrades");

const {validateFields} = require("./middlewares/validateFields");

app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", async (req, res) => {
  res.json({
    message: "Welcome to the Grade Checker API! An API developed by @MohamedWElteir",
    routes: {
      start: "/start",
      end: "/end",
      docs: "/docs",
    },
    repo: `https://github.com/MohamedWElteir/grades-checker`,
  
  }); 
});

app.get("/docs", async (req, res) => {
  const readmePath = path.join(__dirname, "README.md");

  fs.readFile(readmePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading README.md:", err);
      return res.status(500).json({ error: "Failed to load documentation." });
    }
    const htmlContent = marked.parse(data);

    res.send(`
      <html>
        <head>
          <title>API Documentation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color:rgb(182, 182, 182);
              color: #333;
            }
            .container {
              max-width: 800px;
              margin: 20px auto;
              padding: 20px;
              background: #fff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(243, 229, 229, 0.18);
            }
            h1, h2, h3 {
              color: #444;
            }
            a {
              color: #007BFF;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 10px 0;
              border-radius: 4px;
              box-shadow: 0 1px 3px rgba(196, 188, 188, 0.1);
            }
            pre {
              background:rgb(244, 244, 244);
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
            }
            code {
              font-family: "Courier New", Courier, monospace;
              background:rgb(244, 244, 244);
              padding: 2px 4px;
              border-radius: 4px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${htmlContent}
          </div>
        </body>
      </html>
    `);
  });
});

app.post("/start", validateFields(["username", "phoneNumber", "token"]), async (req, res) => {
  const { username, phoneNumber, token } = req.body;

    const result = await startBackgroundProcess(username, phoneNumber, token);
  res.status(result.status).json({
    message: result.message
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

