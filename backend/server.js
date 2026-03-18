/**
 * ╔══════════════════════════════════════╗
 * ║   AgroEase — Backend Server          ║
 * ║   Node.js + Express + MongoDB        ║
 * ║   Version 1.0.0                      ║
 * ╚══════════════════════════════════════╝
 */

require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const helmet   = require("helmet");
const http     = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const routes   = require("./routes");

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

// ── Socket.io (for live tracking) ───────────────────────
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true },
});

// Store driver locations in memory
const driverLocations = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Driver updates their location
  socket.on("driver:location", ({ driverId, lat, lng, orderId }) => {
    driverLocations[driverId] = { lat, lng, updatedAt: new Date() };
    // Broadcast to buyer watching this order
    if (orderId) socket.to(`order:${orderId}`).emit("driver:location:update", { lat, lng, driverId });
  });

  // Buyer joins order room
  socket.on("order:watch", ({ orderId }) => {
    socket.join(`order:${orderId}`);
    const order = socket.request;
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Make io accessible in controllers
app.set("io", io);
app.set("driverLocations", driverLocations);

// ── Middleware ───────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:3000", /\.vercel\.app$/],
  credentials: true,
}));

// Global rate limit
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200,
  message: { success: false, message: "Too many requests" } }));

// OTP rate limit
app.use("/api/auth/send-otp", rateLimit({ windowMs: 60 * 60 * 1000, max: 5,
  message: { success: false, message: "OTP limit — 1 ghante baad try karein" } }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Database ─────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected!"))
  .catch(err => { console.error("❌ MongoDB error:", err.message); process.exit(1); });

// ── Routes ───────────────────────────────────────────────
app.get("/",     (_, res) => res.json({ message: "🌾 AgroEase API chalu hai!" }));
app.use("/api",  routes);

// ── Driver Location API ──────────────────────────────────
app.get("/api/drivers/:driverId/location", (req, res) => {
  const loc = app.get("driverLocations")[req.params.driverId];
  res.json({ success: true, location: loc || null });
});

// ── 404 ──────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route nahi mila" }));

// ── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ success: false, message: "Kuch galat ho gaya" });
});

// ── Start ────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🌾 AgroEase running on http://localhost:${PORT}`);
  console.log(`🌿 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 Socket.io ready for live tracking\n`);
});
