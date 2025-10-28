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

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/trips", tripsRoutes);
// user profile routes (photo upload, name update)
app.use("/api/user", userRoutes);

// serve uploaded files
app.use('/uploads', express.static('uploads'));

// Base route
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
