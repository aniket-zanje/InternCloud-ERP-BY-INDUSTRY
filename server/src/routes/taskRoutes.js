const express = require("express");
const router = express.Router();

const {
  assignTask,
  getMyTasks,
  getMentorTasks,
  getTaskById,
  updateTaskStatus
} = require("../controllers/taskController");

// Import shared JWT authentication middleware from Member 1
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Mentor routes
router.post("/", assignTask);
router.get("/mentor", getMentorTasks);

// Candidate routes
router.get("/my", getMyTasks);

// Common routes
router.get("/:id", getTaskById);
router.patch("/:id/status", updateTaskStatus);

module.exports = router;