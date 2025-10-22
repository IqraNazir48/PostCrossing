import express from "express";
import { getSystemStats } from "../controllers/statsController.js";

const router = express.Router();

// GET /api/stats/overview
router.get("/overview", getSystemStats);

export default router;
