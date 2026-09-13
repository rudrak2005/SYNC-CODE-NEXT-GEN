require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const connectDB = require("./config/db");

const projectRoutes =
  require("./routes/projectRoutes");

const versionRoutes =
  require("./routes/versionRoutes");

const authRoutes =
  require("./routes/authRoutes");

const roomRoutes =
  require("./routes/roomRoutes");

const userRoutes =
  require("./routes/userRoutes");

const executionRoutes =
  require("./routes/executionRoutes");

const aiRoutes =
  require("./routes/aiRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

/*
==================================================
CORS
==================================================
*/

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    /*
     * Allow requests without Origin header
     * such as curl / server-to-server requests.
     */
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(
      `CORS blocked origin: ${origin}`
    );

    return callback(
      new Error(`CORS blocked origin: ${origin}`)
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  credentials: true,
};

/*
 * Express CORS
 */
app.use(cors(corsOptions));

/*
 * Explicit preflight handling
 */
app.options("*", cors(corsOptions));

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
COLLABORATION
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
      "Allowed CORS origins:",
      allowedOrigins
    );
  }
);
