const express = require("express");
const app = express();
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const marked = require("marked");
const { rateLimit } = require("express-rate-limit");
dotenv.config();
const PORT = process.env.PORT || 3000;

const {
  startBackgroundProcess,
  stopBackgroundProcess,
} = require("./helpers/checkForGrades");

const { validateFields } = require("./middlewares/validateFields");

const createRateLimitWindow = (maxRequests, windowMinutes) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    message: "Too many requests, please try again later.",
    handler: (req, res, next, options) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(options.statusCode).json({ error: options.message });
    },
  });
};

const globalLimiter = createRateLimitWindow(100, 15);
const baseLimiter = createRateLimitWindow(100, 15);
const docsLimiter = createRateLimitWindow(80, 15);
const postLimiter = createRateLimitWindow(12, 15);
const deleteLimiter = createRateLimitWindow(12, 15);

app.use(express.json());
app.set("trust proxy", 1); // Trust first proxy
app.use(globalLimiter);
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", baseLimiter, async (req, res) => {
  res.json({
    message:
      "Welcome to the Grade Checker API! An API developed by @MohamedWElteir",
    routes: {
      GET: "/docs",
      POST: "/start",
      DELETE: "/end",
    },
    repo: `https://github.com/MohamedWElteir/grades-checker`,
  });
});

let cachedDocs = null;

app.get("/docs", docsLimiter, async (req, res) => {
try{
  if (cachedDocs) return res.send(cachedDocs);

  const readmePath = path.join(__dirname, "README.md");

  fs.readFile(readmePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading README.md:", err);
      return res.status(500).json({ error: "Failed to load documentation." });
    }
    const htmlContent = marked.parse(data);

    cachedDocs = `
      <html>
        <head>
          <title>API Documentation</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            blockquote {
              border-left: 4px solid #007BFF;
              padding-left: 16px;
              color: #555;
              font-style: italic;
              margin: 20px 0;
            }
              @media (max-width: 768px) {
              .container {
                padding: 15px;
              }
              h1, h2, h3 {
                font-size: 1.2em;
              }
              pre {
                font-size: 0.9em;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${htmlContent}
          </div>
        </body>
      </html>
    `;
    res.send(cachedDocs);
  });
} catch (error) {
  console.error("Error in /docs route:", error);
  res.status(500).json({ error: "Failed to load documentation." });
}
});

app.post(
  "/start",
  postLimiter,
  validateFields(["username", "phoneNumber", "token"]),
  async (req, res) => {
    const { username, phoneNumber, token } = req.body;

    try {
      const result = await startBackgroundProcess(username, phoneNumber, token);
      res.status(result.status).json({
        message: result.message,
      });
    } catch (error) {
      console.error(error);
      res.status(500)
        .json({
        error: `An error occurred while starting the background process: ${error}`,
      });
    }
  }
);

app.delete(
  "/end",
  deleteLimiter,
  validateFields(["username"]),
  async (req, res) => {
    const { username } = req.body;

    try {
      const stopped = await stopBackgroundProcess(username);
      stopped
        ? res.status(204).json({
            message: `Grade checking service stopped for user: ${username}`,
          })
        : res.status(404).json({
            error: "No active process for this user",
          });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while stopping the background process.",
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});