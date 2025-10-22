import express from "express";
import {
  requestPostcard,
  sendPostcard,
  receivePostcard,
  getAllPostcards,
  getPostcardById
} from "../controllers/postcardController.js";

const router = express.Router();

// Request a new postcard (create)
router.post("/request", requestPostcard);

// Mark postcard as sent
router.patch("/send/:pc_id", sendPostcard);

// Mark postcard as received
router.patch("/receive/:pc_id", receivePostcard);

// Get all postcards
router.get("/", getAllPostcards);

// Get single postcard by ID
router.get("/:pc_id", getPostcardById);

export default router;
