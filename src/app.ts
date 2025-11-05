import express, { Request, Response, NextFunction } from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import userRouter from "./routes/user";
import chatRouter from "./routes/chat";
import { socketAuth } from "./middleware/socketAuth";
import { handleSocketConnection } from "./utils/socketHandlers";
import connectMongoDb from "./connection";

dotenv.config();

const PORT = Number(process.env.PORT) || 8000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/live-chat";
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://localhost:3000",
  "http://localhost:3001",
  "https://live-chat-frontend-gilt.vercel.app",
  "https://live-chat-backend-production-09f2.up.railway.app",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP" },
});

app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Static files
if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../public")));
}

// API Routes
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);

// Socket.IO
io.use(socketAuth);
io.on("connection", (socket) => {
  handleSocketConnection(io, socket);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (NODE_ENV === "development") {
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  server.close(() => {
    process.exit(0);
  });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectMongoDb(MONGODB_URI);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    // Add server error handling
    server.on("error", (error) => {
      console.error("Server error:", error);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "Unknown error"
    );
    process.exit(1);
  }
};

startServer();

export default app;
