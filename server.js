import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import postcardRoutes from "./routes/postcardRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import statsRoutes from "./routes/statsRoutes.js"; 

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/postcards", postcardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => {
  res.send("PostCrossing API is running...");
});

// MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
});
