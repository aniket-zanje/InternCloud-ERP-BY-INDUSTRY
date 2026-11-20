const mongoose = require("mongoose");
const Task = require("../models/Task");
const Intern = require("../models/Intern");

// Get logged-in user's ID
const getUserId = (req) => req.user?.id || req.user?._id;

// Get logged-in user's organization
const getOrganizationId = (req) =>
  req.user?.organizationId?._id || req.user?.organizationId;


// =====================================================
// 1. MENTOR: ASSIGN TASK TO INTERN
// =====================================================

exports.assignTask = async (req, res) => {
  try {
    const mentorId = getUserId(req);
    const organizationId = getOrganizationId(req);

    if (!mentorId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication information is missing."
      });
    }

    if (req.user.role !== "MENTOR") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can assign tasks."
      });
    }

    const {
      internId,
      title,
      taskCode,
      description,
      priority,
      frequency,
      assignedDate,
      dueDate
    } = req.body;

    // Validate required fields
    if (
      !internId ||
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !assignedDate ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Intern, valid title, description, assigned date and due date are required."
      });
    }

    // Validate intern ID
    if (!mongoose.isValidObjectId(internId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid intern ID."
      });
    }

    // Find active intern assigned to this mentor
    const intern = await Intern.findOne({
      _id: internId,
      organizationId,
      mentorId,
      internshipStatus: "ACTIVE"
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Active intern assigned to you was not found."
      });
    }

    // Validate dates
    const assigned = new Date(assignedDate);
    const due = new Date(dueDate);

    if (
      Number.isNaN(assigned.getTime()) ||
      Number.isNaN(due.getTime()) ||
      due < assigned
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid dates. Due date cannot precede assigned date."
      });
    }

    // Create task
    const task = await Task.create({
      organizationId,
      internId,
      mentorId,
      openingId: intern.openingId,
      title: title.trim(),
      taskCode: taskCode?.trim() || undefined,
      description: description.trim(),
      priority: priority || "MEDIUM",
      frequency: frequency || "ONCE",
      assignedDate: assigned,
      dueDate: due,
      status: "ASSIGNED"
    });

    return res.status(201).json({
      success: true,
      message: "Task assigned successfully.",
      task
    });

  } catch (error) {
    console.error("Assign Task Error:", error);

    return res.status(500).json({
      success: false,
      message: error.code === 11000
        ? "This task code already exists in your organization."
        : "Unable to assign task.",
      error: error.message
    });
  }
};


// =====================================================
// 2. CANDIDATE: VIEW MY ASSIGNED TASKS
// =====================================================

exports.getMyTasks = async (req, res) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication information is missing."
      });
    }

    if (req.user.role !== "CANDIDATE") {
      return res.status(403).json({
        success: false,
        message: "Only candidates can access this endpoint."
      });
    }

    const intern = await Intern.findOne({
      userId,
      organizationId
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Your internship record was not found."
      });
    }

    const tasks = await Task.find({
      internId: intern._id,
      organizationId
    })
      .populate("mentorId", "fullName email")
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    console.error("Get My Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your tasks."
    });
  }
};


// =====================================================
// 3. MENTOR: VIEW TASKS ASSIGNED BY LOGGED-IN MENTOR
// =====================================================

exports.getMentorTasks = async (req, res) => {
  try {
    const mentorId = getUserId(req);
    const organizationId = getOrganizationId(req);

    if (!mentorId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication information is missing."
      });
    }

    if (req.user.role !== "MENTOR") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can access this endpoint."
      });
    }

    const tasks = await Task.find({
      mentorId,
      organizationId
    })
      .populate({
        path: "internId",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    console.error("Get Mentor Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch mentor tasks."
    });
  }
};


// =====================================================
// 4. MENTOR/CANDIDATE: VIEW SINGLE TASK
// =====================================================

exports.getTaskById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication information is missing."
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID."
      });
    }

    const task = await Task.findOne({
      _id: id,
      organizationId
    })
      .populate("mentorId", "fullName email")
      .populate({
        path: "internId",
        populate: {
          path: "userId",
          select: "fullName email"
        }
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found."
      });
    }

    const isMentor =
      req.user.role === "MENTOR" &&
      String(task.mentorId?._id || task.mentorId) === String(userId);

    const isCandidate =
      req.user.role === "CANDIDATE" &&
      String(task.internId?.userId?._id || task.internId?.userId) === String(userId);

    if (!isMentor && !isCandidate) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this task."
      });
    }

    return res.status(200).json({
      success: true,
      task
    });

  } catch (error) {
    console.error("Get Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch task."
    });
  }
};


// =====================================================
// 5. CANDIDATE: UPDATE TASK PROGRESS
// =====================================================

exports.updateTaskStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication information is missing."
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID."
      });
    }

    if (req.user.role !== "CANDIDATE") {
      return res.status(403).json({
        success: false,
        message: "Only candidates can update task progress."
      });
    }

    // Candidates can only start work
    if (status !== "IN_PROGRESS") {
      return res.status(400).json({
        success: false,
        message: "Candidates can only change task status to IN_PROGRESS. Submit your work for mentor review."
      });
    }

    const intern = await Intern.findOne({
      userId,
      organizationId
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Internship record not found."
      });
    }

    const task = await Task.findOne({
      _id: id,
      internId: intern._id,
      organizationId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to you."
      });
    }

    if (["COMPLETED", "EXPIRED", "OVERDUE"].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: "This task cannot be updated."
      });
    }

    // Prevent starting an overdue task
    if (new Date() > task.dueDate) {
      return res.status(400).json({
        success: false,
        message: "The task due date has passed. Contact your mentor."
      });
    }

    task.status = "IN_PROGRESS";
    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task progress updated successfully.",
      task
    });

  } catch (error) {
    console.error("Update Task Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update task status."
    });
  }
};
