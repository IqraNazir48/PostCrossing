// routes/transactionRoutes.js
import express from "express";
import { getTransactions } from "../controllers/transactionController.js";

const router = express.Router();

// ✅ single route for fetching transactions
router.get("/", getTransactions);

export default router;
