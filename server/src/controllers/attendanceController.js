const mongoose = require("mongoose");

const Attendance = require("../models/Attendance");
const Intern = require("../models/Intern");


// =====================================================
// HELPER 1: NORMALIZE DATE
// =====================================================

const normalizeDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
};


// =====================================================
// HELPER 2: VALIDATE DATE-TIME
// =====================================================

const parseDateTime = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};


// =====================================================
// HELPER 3: CALCULATE WORKING HOURS
// =====================================================

const calculateWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;

  const milliseconds = checkOut.getTime() - checkIn.getTime();

  return Number((milliseconds / (1000 * 60 * 60)).toFixed(2));
};


// =====================================================
// HELPER 4: ATTENDANCE PERCENTAGE
// LEAVE IS EXCLUDED FROM THE DENOMINATOR
// =====================================================

const getAttendancePercentage = (records) => {

  const eligibleRecords = records.filter(
    record => record.status !== "LEAVE"
  );

  if (eligibleRecords.length === 0) {
    return 0;
  }

  const attendedDays = eligibleRecords.reduce((total, record) => {

    if (record.status === "PRESENT") {
      return total + 1;
    }

    if (record.status === "HALF_DAY") {
      return total + 0.5;
    }

    return total;

  }, 0);

  return Number(
    ((attendedDays / eligibleRecords.length) * 100).toFixed(2)
  );
};


// =====================================================
// HELPER 5: ATTENDANCE SUMMARY
// =====================================================

const createAttendanceSummary = (records) => {

  const present = records.filter(
    r => r.status === "PRESENT"
  ).length;

  const absent = records.filter(
    r => r.status === "ABSENT"
  ).length;

  const halfDay = records.filter(
    r => r.status === "HALF_DAY"
  ).length;

  const leave = records.filter(
    r => r.status === "LEAVE"
  ).length;

  const eligibleDays = present + absent + halfDay;

  return {
    totalDays: records.length,
    eligibleDays,
    present,
    absent,
    halfDay,
    leave,
    attendancePercentage: getAttendancePercentage(records)
  };
};


// =====================================================
// 1. MENTOR: MARK INTERN ATTENDANCE
// POST /api/attendance
// =====================================================

exports.markAttendance = async (req, res) => {
  try {

    if (req.user.role !== "MENTOR") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can mark attendance."
      });
    }

    const {
      internId,
      attendanceDate,
      status,
      checkIn,
      checkOut,
      remarks
    } = req.body;


    // Required fields
    if (!internId || !attendanceDate || !status) {
      return res.status(400).json({
        success: false,
        message: "Intern ID, attendance date and status are required."
      });
    }


    // Validate intern ID
    if (!mongoose.Types.ObjectId.isValid(internId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid intern ID."
      });
    }


    // Validate attendance status
    const validStatuses = [
      "PRESENT",
      "ABSENT",
      "HALF_DAY",
      "LEAVE"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status."
      });
    }


    // Validate remarks
    if (
      remarks !== undefined &&
      typeof remarks !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Remarks must be text."
      });
    }


    // Validate attendance date
    const date = normalizeDate(attendanceDate);

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Attendance date must be a valid YYYY-MM-DD date."
      });
    }


    // Future attendance not allowed
    const today = normalizeDate(
      new Date().toISOString().slice(0, 10)
    );

    if (date > today) {
      return res.status(400).json({
        success: false,
        message: "Future attendance cannot be marked."
      });
    }


    // Check-in and check-out must be provided together
    if (
      Boolean(checkIn) !== Boolean(checkOut)
    ) {
      return res.status(400).json({
        success: false,
        message: "Both check-in and check-out times must be provided together."
      });
    }


    let parsedCheckIn = null;
    let parsedCheckOut = null;
    let workingHours = 0;


    if (checkIn && checkOut) {

      parsedCheckIn = parseDateTime(checkIn);
      parsedCheckOut = parseDateTime(checkOut);

      if (!parsedCheckIn || !parsedCheckOut) {
        return res.status(400).json({
          success: false,
          message: "Invalid check-in or check-out date-time."
        });
      }


      // Both times must belong to the attendance date
      const checkInDate = parsedCheckIn.toISOString().slice(0, 10);
      const checkOutDate = parsedCheckOut.toISOString().slice(0, 10);

      if (
        checkInDate !== attendanceDate ||
        checkOutDate !== attendanceDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Check-in and check-out must belong to the attendance date."
        });
      }


      // Check-out must be after check-in
      if (parsedCheckOut <= parsedCheckIn) {
        return res.status(400).json({
          success: false,
          message: "Check-out must be after check-in."
        });
      }

      workingHours = calculateWorkingHours(
        parsedCheckIn,
        parsedCheckOut
      );
    }


    // ABSENT and LEAVE cannot have working times
    if (
      (status === "ABSENT" || status === "LEAVE") &&
      (checkIn || checkOut)
    ) {
      return res.status(400).json({
        success: false,
        message: "Check-in and check-out are not allowed for ABSENT or LEAVE."
      });
    }


    const organizationId = req.user.organizationId;


    // Verify intern belongs to this mentor and organization
    const intern = await Intern.findOne({
      _id: internId,
      organizationId,
      mentorId: req.user.id,
      internshipStatus: "ACTIVE"
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Active intern not found under your mentorship."
      });
    }


    // Prevent duplicate attendance
    const existingRecord = await Attendance.findOne({
      organizationId,
      internId,
      attendanceDate: date
    });

    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: "Attendance has already been marked for this date."
      });
    }


    // Create attendance
    const attendance = await Attendance.create({
      organizationId,
      internId,
      mentorId: req.user.id,
      attendanceDate: date,
      status,
      checkIn: parsedCheckIn,
      checkOut: parsedCheckOut,
      workingHours,
      remarks: remarks?.trim() || "",
      markedBy: req.user.id
    });


    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully.",
      attendance
    });

  } catch (error) {

    console.error("Mark Attendance Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for this intern and date."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to mark attendance."
    });
  }
};


// =====================================================
// 2. CANDIDATE: VIEW OWN ATTENDANCE
// GET /api/attendance/my
// =====================================================

exports.getMyAttendance = async (req, res) => {
  try {

    if (req.user.role !== "CANDIDATE") {
      return res.status(403).json({
        success: false,
        message: "Only candidates can access their attendance."
      });
    }

    const { month, year } = req.query;


    const intern = await Intern.findOne({
      userId: req.user.id,
      organizationId: req.user.organizationId
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found."
      });
    }


    const filter = {
      organizationId: req.user.organizationId,
      internId: intern._id
    };


    // Optional month/year filtering
    if (month !== undefined || year !== undefined) {

      const m = Number(month);
      const y = Number(year);

      if (
        !Number.isInteger(m) ||
        m < 1 ||
        m > 12 ||
        !Number.isInteger(y) ||
        y < 2000 ||
        y > 2100
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide valid month (1-12) and year."
        });
      }

      filter.attendanceDate = {
        $gte: new Date(Date.UTC(y, m - 1, 1)),
        $lt: new Date(Date.UTC(y, m, 1))
      };
    }


    const records = await Attendance.find(filter)
      .sort({ attendanceDate: -1 });


    return res.status(200).json({
      success: true,
      count: records.length,
      attendance: records,
      attendancePercentage: getAttendancePercentage(records)
    });

  } catch (error) {

    console.error("Get My Attendance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve attendance."
    });
  }
};


// =====================================================
// 3. MENTOR: VIEW INDIVIDUAL INTERN ATTENDANCE
// GET /api/attendance/intern/:internId
// =====================================================

exports.getInternAttendance = async (req, res) => {
  try {

    if (req.user.role !== "MENTOR") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can view intern attendance."
      });
    }

    const { internId } = req.params;


    if (!mongoose.Types.ObjectId.isValid(internId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid intern ID."
      });
    }


    const intern = await Intern.findOne({
      _id: internId,
      organizationId: req.user.organizationId,
      mentorId: req.user.id
    }).populate("userId", "fullName email");


    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found under your mentorship."
      });
    }


    const records = await Attendance.find({
      organizationId: req.user.organizationId,
      internId: intern._id
    }).sort({ attendanceDate: -1 });


    return res.status(200).json({
      success: true,
      intern: intern.userId,
      count: records.length,
      attendance: records,
      attendancePercentage: getAttendancePercentage(records)
    });

  } catch (error) {

    console.error("Get Intern Attendance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve intern attendance."
    });
  }
};


// =====================================================
// 4. CANDIDATE: OWN ATTENDANCE SUMMARY
// GET /api/attendance/summary/my
// =====================================================

exports.getMyAttendanceSummary = async (req, res) => {
  try {

    if (req.user.role !== "CANDIDATE") {
      return res.status(403).json({
        success: false,
        message: "Only candidates can view their attendance summary."
      });
    }


    const intern = await Intern.findOne({
      userId: req.user.id,
      organizationId: req.user.organizationId
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found."
      });
    }


    const records = await Attendance.find({
      organizationId: req.user.organizationId,
      internId: intern._id
    });


    const summary = createAttendanceSummary(records);


    return res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {

    console.error("My Attendance Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate attendance summary."
    });
  }
};


// =====================================================
// 5. MENTOR: INTERN ATTENDANCE SUMMARY
// GET /api/attendance/summary/:internId
// =====================================================

exports.getInternAttendanceSummary = async (req, res) => {
  try {

    if (req.user.role !== "MENTOR") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can view attendance summaries."
      });
    }

    const { internId } = req.params;


    if (!mongoose.Types.ObjectId.isValid(internId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid intern ID."
      });
    }


    const intern = await Intern.findOne({
      _id: internId,
      organizationId: req.user.organizationId,
      mentorId: req.user.id
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found under your mentorship."
      });
    }


    const records = await Attendance.find({
      organizationId: req.user.organizationId,
      internId: intern._id
    });


    const summary = createAttendanceSummary(records);


    return res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {

    console.error("Intern Attendance Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate attendance summary."
    });
  }
};