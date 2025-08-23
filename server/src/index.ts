import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/database";
import passport from "./config/passport";
import authRoutes from "./routes/auth";
import connectRoutes from "./routes/connect";
import profileRoutes from "./routes/profile";
import friendsRoutes from "./routes/friends";
import chatRoutes from "./routes/chat";
// import notificationRoutes from "./routes/notifications";

import { initializeSocket } from "./config/socket";
import morgan from "morgan";
import { createServer } from "http";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

const io = initializeSocket(server);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Passport middleware
app.use(passport.initialize());

// Logger middleware
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/connect", connectRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/chat", chatRoutes);
// app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
