require("dotenv").config();
const projectRoutes =
  require("./routes/projectRoutes");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

const PORT = process.env.PORT || 5000;


// ==============================
// CORS
// ==============================



app.use(
  cors({
    origin: "http://localhost:5173",
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    credentials: true
  })
);


// ==============================
// BODY PARSER
// ==============================

app.use(express.json());


// ==============================
// API ROUTES
// ==============================

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use(
  "/api/projects",
  projectRoutes
);

// ==============================
// DATABASE
// ==============================

connectDB();


// ==============================
// HTTP SERVER
// ==============================

const httpServer = http.createServer(app);


// ==============================
// SOCKET.IO
// ==============================

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});


const initializeCollaboration =
  require("./sockets/collaborationSocket");

initializeCollaboration(io);


// ==============================
// START SERVER
// ==============================

httpServer.listen(PORT, () => {
  console.log(
    `SyncCode API running on port ${PORT}`
  );
});