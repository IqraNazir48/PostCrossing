import express from "express";
import {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/userController.js";

const router = express.Router();

// Register (create) a new user
router.post("/register", registerUser);

// Get all users
router.get("/", getAllUsers);

// Get user by ID
router.get("/:id", getUserById);

// Update user
router.patch("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

export default router;
