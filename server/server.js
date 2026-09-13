require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

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

const allowedOrigins = [
  "http://localhost:5173",
  "https://sync-code-next-gen-2.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header(
      "Access-Control-Allow-Origin",
      origin
    );
  }

  res.header(
    "Vary",
    "Origin"
  );

  res.header(
    "Access-Control-Allow-Credentials",
    "true"
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});


app.use(express.json());

app.use("/api/version", versionRoutes);
app.use("/api/execute", executionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

connectDB();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://sync-code-next-gen-2.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const initializeCollaboration =
  require("./sockets/collaborationSocket");

initializeCollaboration(io);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`SyncCode API running on port ${PORT}`);
});
