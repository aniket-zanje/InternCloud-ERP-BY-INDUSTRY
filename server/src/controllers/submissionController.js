const mongoose = require("mongoose");

const Task = require("../models/Task");
const Intern = require("../models/Intern");
const TaskSubmission = require("../models/TaskSubmission");


// ======================================================
// 1. CANDIDATE: SUBMIT COMPLETED TASK
// POST /api/submissions/tasks/:id
// ======================================================

exports.submitTask = async (req, res) => {
  try {

    if (req.user.role !== "CANDIDATE") {
      return res.status(403).json({
        success: false,
        message: "Only candidates can submit tasks.",
      });
    }

    const { id: taskId } = req.params;
    const { submissionText, submissionLinks = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    if (
      typeof submissionText !== "string" ||
      !submissionText.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Submission description is required.",
      });
    }

    if (
      !Array.isArray(submissionLinks) ||
      !submissionLinks.every(
        (link) => typeof link === "string" && link.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Submission links must be an array of valid strings.",
      });
    }

    const organizationId = req.user.organizationId;

    // Find candidate's intern profile
    const intern = await Intern.findOne({
      userId: req.user.id,
      organizationId,
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found.",
      });
    }

    // Find task assigned specifically to this candidate
    const task = await Task.findOne({
      _id: taskId,
      organizationId,
      internId: intern._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to you.",
      });
    }

    // Only IN_PROGRESS tasks can be submitted
    if (task.status !== "IN_PROGRESS") {
      return res.status(400).json({
        success: false,
        message: "Only tasks currently in progress can be submitted.",
      });
    }

    // Check task deadline
    if (new Date() > new Date(task.dueDate)) {
      return res.status(400).json({
        success: false,
        message: "Task deadline has passed.",
      });
    }

    // Get previous submission attempt
    const previousSubmission = await TaskSubmission.findOne({
      organizationId,
      taskId: task._id,
      internId: intern._id,
    }).sort({ attemptNumber: -1 });

    // Prevent duplicate submission while review is pending
    if (
      previousSubmission &&
      previousSubmission.reviewStatus === "PENDING"
    ) {
      return res.status(409).json({
        success: false,
        message: "Your previous submission is awaiting mentor review.",
      });
    }

    // Resubmission is allowed only after revision is requested
    if (
      previousSubmission &&
      previousSubmission.reviewStatus !== "REVISION_REQUIRED"
    ) {
      return res.status(400).json({
        success: false,
        message: "Resubmission is not allowed for this submission.",
      });
    }

    // Calculate attempt number
    const attemptNumber = previousSubmission
      ? previousSubmission.attemptNumber + 1
      : 1;

    // Create new submission
    const submission = await TaskSubmission.create({
      organizationId,
      taskId: task._id,
      internId: intern._id,
      submissionText: submissionText.trim(),
      submissionLinks: submissionLinks.map((link) => link.trim()),
      submittedAt: new Date(),
      attemptNumber,
      reviewStatus: "PENDING",
    });

    // Update task status
    task.status = "SUBMITTED";
    await task.save();

    return res.status(201).json({
      success: true,
      message: "Task submitted successfully for mentor review.",
      submission,
    });

  } catch (error) {

    console.error("Submit Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit task.",
    });
  }
};


// ======================================================
// 2. MENTOR: VIEW SUBMISSIONS FOR A TASK
// GET /api/submissions/tasks/:id
// ======================================================

exports.getTaskSubmissions = async (req, res) => {
  try {

    if (req.user.role !== "MENTOR") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can view task submissions.",
      });
    }

    const { id: taskId } = req.params;
    const organizationId = req.user.organizationId;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    // Verify task belongs to current mentor
    const task = await Task.findOne({
      _id: taskId,
      organizationId,
      mentorId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned by you.",
      });
    }

    // Fetch submissions
    const submissions = await TaskSubmission.find({
      organizationId,
      taskId: task._id,
    })
      .populate({
        path: "internId",
        populate: {
          path: "userId",
          select: "fullName email",
        },
      })
      .populate("taskId", "title priority dueDate")
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });

  } catch (error) {

    console.error("Get Submissions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve submissions.",
    });
  }
};


// ======================================================
// 3. MENTOR: REVIEW AND EVALUATE SUBMISSION
// PATCH /api/submissions/:submissionId/review
// ======================================================

exports.reviewSubmission = async (req, res) => {
  try {

    if (req.user.role !== "MENTOR") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can evaluate submissions.",
      });
    }

    const { submissionId } = req.params;

    const {
      reviewStatus,
      score,
      mentorComment,
    } = req.body;

    // Validate submission ID
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID.",
      });
    }

    // Allowed mentor decisions
    const allowedStatuses = [
      "APPROVED",
      "REJECTED",
      "REVISION_REQUIRED",
    ];

    if (!allowedStatuses.includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review status.",
      });
    }

    // Score required for approval
    if (
      reviewStatus === "APPROVED" &&
      (
        score === undefined ||
        score === null ||
        !Number.isInteger(score) ||
        score < 0 ||
        score > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid score between 0 and 100 is required for approval.",
      });
    }

    // Validate optional score
    if (
      score !== undefined &&
      score !== null &&
      (
        !Number.isInteger(score) ||
        score < 0 ||
        score > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Score must be an integer between 0 and 100.",
      });
    }

    // Validate mentor comment
    if (
      mentorComment !== undefined &&
      typeof mentorComment !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Mentor feedback must be text.",
      });
    }

    // Feedback required for revision
    if (
      reviewStatus === "REVISION_REQUIRED" &&
      !mentorComment?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Feedback is required when requesting revision.",
      });
    }

    const organizationId = req.user.organizationId;

    // Find submission in current organization
    const submission = await TaskSubmission.findOne({
      _id: submissionId,
      organizationId,
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found.",
      });
    }

    // Prevent reviewing the same submission twice
    if (submission.reviewStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "This submission has already been reviewed.",
      });
    }

    // Verify that current mentor assigned this task
    const task = await Task.findOne({
      _id: submission.taskId,
      organizationId,
      mentorId: req.user.id,
    });

    if (!task) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to evaluate this task.",
      });
    }

    // Save evaluation details
    submission.reviewStatus = reviewStatus;
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();

    if (score !== undefined && score !== null) {
      submission.score = score;
    }

    if (mentorComment !== undefined) {
      submission.mentorComment = mentorComment.trim();
    }

    await submission.save();

    // Update task status according to mentor decision
    switch (reviewStatus) {

      case "APPROVED":
        // Candidate successfully completed the task
        task.status = "COMPLETED";
        break;

      case "REVISION_REQUIRED":
        // Candidate can correct and submit again
        task.status = "IN_PROGRESS";
        break;

      case "REJECTED":
        // Final rejection; candidate cannot resubmit
        task.status = "REJECTED";
        break;
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: `Submission ${reviewStatus.toLowerCase()} successfully.`,
      submission,
      taskStatus: task.status,
    });

  } catch (error) {

    console.error("Review Submission Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to evaluate submission.",
    });
  }
};