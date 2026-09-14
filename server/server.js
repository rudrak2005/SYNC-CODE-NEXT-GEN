require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const projectRoutes = require("./routes/projectRoutes");
const versionRoutes = require("./routes/versionRoutes");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const userRoutes = require("./routes/userRoutes");
const executionRoutes = require("./routes/executionRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

/*
==================================================
CORS
==================================================
*/

const allowedOrigins = [
  "http://localhost:5173",
  "https://sync-code-next-gen.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

/*
==================================================
CORS MIDDLEWARE
==================================================
*/

app.use((req, res, next) => {
  const origin = req.headers.origin;

  /*
   * Allow only known frontend origins.
   */
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      origin
    );
  }

  /*
   * Important for dynamic Origin responses.
   */
  res.setHeader("Vary", "Origin");

  /*
   * Credentials
   */
  res.setHeader(
    "Access-Control-Allow-Credentials",
    "true"
  );

  /*
   * Allowed methods
   */
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );

  /*
   * Allowed headers
   */
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  /*
   * Preflight request
   */
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/*
==================================================
BODY PARSER
==================================================
*/

app.use(express.json());

/*
==================================================
API ROUTES
==================================================
*/

app.use(
  "/api/version",
  versionRoutes
);

app.use(
  "/api/execute",
  executionRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/rooms",
  roomRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/projects",
  projectRoutes
);

/*
==================================================
DATABASE
==================================================
*/

connectDB();

/*
==================================================
HTTP SERVER
==================================================
*/

const httpServer =
  http.createServer(app);

/*
==================================================
SOCKET.IO
==================================================
*/

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,

    methods: [
      "GET",
      "POST",
    ],

    credentials: true,
  },
});

/*
==================================================
COLLABORATION SOCKET
==================================================
*/

const initializeCollaboration =
  require("./sockets/collaborationSocket");

initializeCollaboration(io);

/*
==================================================
START SERVER
==================================================
*/

httpServer.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `SyncCode API running on port ${PORT}`
    );

    console.log(
      "Allowed origins:",
      allowedOrigins
    );
  }
);
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SyncCode API is running",
    origin: req.headers.origin || null,
  });
});
