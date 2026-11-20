const express = require("express");
const router = express.Router();

const {
  submitTask,
  getTaskSubmissions,
  reviewSubmission,
} = require("../controllers/submissionController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// Candidate submits completed task
router.post("/tasks/:id", submitTask);

// Mentor views submissions for an assigned task
router.get("/tasks/:id", getTaskSubmissions);

// Mentor evaluates submission
router.patch("/:submissionId/review", reviewSubmission);

module.exports = router;