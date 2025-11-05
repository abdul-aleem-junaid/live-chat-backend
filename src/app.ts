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

const io = new Server(server, {
  cors: {
    origin: NODE_ENV === "production" ? process.env.CLIENT_URL : "*",
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
    origin: NODE_ENV === "production" ? process.env.CLIENT_URL : "*",
    credentials: true,
  })
);

// Rate limiting (skip for health checks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === "production" ? 100 : 1000,
  message: { error: "Too many requests from this IP" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/'
});

app.use("/api/", limiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

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

// Health check
app.get("/health", (req: Request, res: Response) => {
  console.log('Health check requested');
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    port: PORT
  });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  console.log('Root endpoint requested');
  res.status(200).json({
    message: "Live Chat Backend API",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

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
    console.log('Starting server...');
    console.log('PORT:', PORT);
    console.log('MONGODB_URI:', MONGODB_URI ? 'Set' : 'Not set');
    console.log('NODE_ENV:', NODE_ENV);
    
    await connectMongoDb(MONGODB_URI);
    console.log('Database connected successfully');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server listening on 0.0.0.0:${PORT}`);
      console.log('Health check endpoint: /health');
    });
    
    // Add server error handling
    server.on('error', (error) => {
      console.error('Server error:', error);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    process.exit(1);
  }
};

// Add uncaught exception handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;
