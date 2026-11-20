const express = require("express");
const router = express.Router();

const {
  markAttendance,
  getMyAttendance,
  getInternAttendance,
  getMyAttendanceSummary,
  getInternAttendanceSummary,
} = require("../controllers/attendanceController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// Candidate routes must come before /:internId routes
router.get("/my", getMyAttendance);
router.get("/summary/my", getMyAttendanceSummary);

// Mentor routes
router.post("/", markAttendance);
router.get("/intern/:internId", getInternAttendance);
router.get("/summary/:internId", getInternAttendanceSummary);

module.exports = router;