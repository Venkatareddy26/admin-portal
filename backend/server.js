import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import route files
import analyticsRoutes from "./routes/analyticsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import documentsRoutes from "./routes/documentsRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";
import tripsRoutes from "./routes/tripsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import kpiRoutes from "./routes/kpiRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// Performance: Enable compression for responses
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// CORS with caching
app.use(cors({
  origin: true,
  credentials: true,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// JSON parsing with size limit
app.use(express.json({ limit: '10mb' }));

// Request logging (minimal)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) console.log(`⚠️ Slow request: ${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/expenses", expenseRoutes); // alias
app.use("/api/policy", policyRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/trips", tripsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/kpi", kpiRoutes);

// Serve uploaded files with caching
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: true
}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Base route
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
