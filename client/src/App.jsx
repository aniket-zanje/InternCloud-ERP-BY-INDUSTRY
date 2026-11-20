import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import "./Member3.css";

import {
  apiRequest,
  credentialsAvailable,
  formatDate,
  getErrorMessage,
} from "./api.js";

const initialForm = {
  internId: "",
  title: "",
  taskCode: "",
  description: "",
  priority: "MEDIUM",
  frequency: "ONCE",
  assignedDate: "",
  dueDate: "",
};

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [reviewForm, setReviewForm] = useState({
    status: "APPROVED",
    score: "",
    mentorComment: "",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    internId: "",
    attendanceDate: new Date().toISOString().slice(0, 10),
    status: "PRESENT",
    checkIn: "",
    checkOut: "",
    remarks: "",
  });

  // =====================================
  // FETCH MENTOR TASKS
  // =====================================

  const fetchTasks = useCallback(async () => {
    if (!credentialsAvailable) return;

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/tasks/mentor", {}, "MENTOR");
      setTasks(data.tasks || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================
  // FETCH ATTENDANCE
  // =====================================

  const fetchAttendance = useCallback(async (internId) => {
    if (!internId || !credentialsAvailable) return;

    setLoading(true);
    setError("");

    try {
      const [records, summary] = await Promise.all([
        apiRequest(
          `/api/attendance/intern/${internId}`,
          {},
          "MENTOR"
        ),
        apiRequest(
          `/api/attendance/summary/${internId}`,
          {},
          "MENTOR"
        ),
      ]);

      setAttendance(
        records.attendance || records.records || []
      );

      setAttendanceSummary(summary.summary || summary);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // =====================================
  // STATISTICS
  // =====================================

  const stats = useMemo(() => ({
    total: tasks.length,

    assigned: tasks.filter(
      (task) => task.status === "ASSIGNED"
    ).length,

    inProgress: tasks.filter(
      (task) => task.status === "IN_PROGRESS"
    ).length,

    submitted: tasks.filter(
      (task) => task.status === "SUBMITTED"
    ).length,

    completed: tasks.filter(
      (task) => task.status === "COMPLETED"
    ).length,
  }), [tasks]);

  // =====================================
  // SEARCH AND FILTER
  // =====================================

  const filteredTasks = tasks.filter((task) => {
    const internName =
      task.internId?.userId?.fullName || "";

    const matchesSearch =
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      internName.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "ALL" || task.status === filter;

    return matchesSearch && matchesFilter;
  });

  // =====================================
  // TASK FORM
  // =====================================

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleAssignTask(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!credentialsAvailable) {
      setError("Configure mentor and organization IDs first.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest(
        "/api/tasks",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
        "MENTOR"
      );

      setMessage("Task assigned successfully!");
      setForm(initialForm);
      setShowForm(false);

      await fetchTasks();

      setActiveSection("tasks");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // FETCH SUBMISSIONS FOR A TASK
  // =====================================

  async function openSubmissions(task) {
    setSelectedTask(task);
    setSubmissions([]);
    setReviewForm({
      status: "APPROVED",
      score: "",
      mentorComment: "",
    });

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        `/api/submissions/tasks/${task._id}`,
        {},
        "MENTOR"
      );

      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // =====================================
  // REVIEW SUBMISSION
  // =====================================

  async function reviewSubmission(submissionId) {
    setError("");
    setMessage("");

    if (
      reviewForm.status === "APPROVED" &&
      (
        reviewForm.score === "" ||
        !Number.isInteger(Number(reviewForm.score)) ||
        Number(reviewForm.score) < 0 ||
        Number(reviewForm.score) > 100
      )
    ) {
      setError("Enter a valid score between 0 and 100.");
      return;
    }

    if (
      reviewForm.status === "REVISION_REQUIRED" &&
      !reviewForm.mentorComment.trim()
    ) {
      setError("A mentor comment is required for revision.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest(
        `/api/submissions/${submissionId}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({
            reviewStatus: reviewForm.status,
            score:
              reviewForm.score === ""
                ? undefined
                : Number(reviewForm.score),
            mentorComment: reviewForm.mentorComment.trim(),
          }),
        },
        "MENTOR"
      );

      setMessage("Submission reviewed successfully.");

      await fetchTasks();

      if (selectedTask) {
        await openSubmissions(selectedTask);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // MARK ATTENDANCE
  // =====================================

  function handleAttendanceChange(event) {
    setAttendanceForm({
      ...attendanceForm,
      [event.target.name]: event.target.value,
    });
  }

  async function markAttendance(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!attendanceForm.internId) {
      setError("Select an intern.");
      return;
    }

    const hasCheckIn = Boolean(attendanceForm.checkIn);
    const hasCheckOut = Boolean(attendanceForm.checkOut);

    if (hasCheckIn !== hasCheckOut) {
      setError("Provide both check-in and check-out times.");
      return;
    }

    if (
      ["ABSENT", "LEAVE"].includes(attendanceForm.status) &&
      (hasCheckIn || hasCheckOut)
    ) {
      setError("Absent and Leave records cannot have check-in/out times.");
      return;
    }

    const payload = {
      internId: attendanceForm.internId,
      attendanceDate: attendanceForm.attendanceDate,
      status: attendanceForm.status,
      remarks: attendanceForm.remarks,
    };

    if (hasCheckIn && hasCheckOut) {
      payload.checkIn = new Date(
        `${attendanceForm.attendanceDate}T${attendanceForm.checkIn}:00`
      ).toISOString();

      payload.checkOut = new Date(
        `${attendanceForm.attendanceDate}T${attendanceForm.checkOut}:00`
      ).toISOString();
    }

    setSaving(true);

    try {
      await apiRequest(
        "/api/attendance",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "MENTOR"
      );

      setMessage("Attendance marked successfully.");

      const internId = attendanceForm.internId;

      await fetchAttendance(internId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // NAVIGATION
  // =====================================

  function navigate(section) {
    setActiveSection(section);
    setMessage("");
    setError("");
    setShowForm(section === "assign");
    setSelectedTask(null);
  }

  const sectionTitles = {
    dashboard: "Mentor Dashboard",
    tasks: "My Assigned Tasks",
    assign: "Assign New Task",
    progress: "Task Progress",
    submissions: "Submission Reviews",
    attendance: "Attendance Management",
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="app-layout">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">S</div>

          <div>
            <h2>InternCloud</h2>
            <span>Internship Platform</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">

          {[
            ["dashboard", "▦", "Dashboard"],
            ["tasks", "▤", "My Tasks"],
            ["assign", "＋", "Assign Task"],
            ["progress", "◷", "Task Progress"],
            ["submissions", "✓", "Submission Reviews"],
            ["attendance", "▣", "Attendance"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={`nav-item ${
                activeSection === id ? "active" : ""
              }`}
              onClick={() => navigate(id)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}

        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">M</div>

          <div>
            <strong>Mentor</strong>
            <small>Mentor Workspace</small>
          </div>
        </div>

      </aside>

      {/* MAIN */}

      <main className="main-content">

        <header className="topbar">
          <div>
            <span className="breadcrumb">
              Workspace / Mentor / {sectionTitles[activeSection]}
            </span>

            <h1>{sectionTitles[activeSection]}</h1>
          </div>

          <button
            className="primary-btn"
            onClick={() => navigate("assign")}
          >
            + Assign New Task
          </button>
        </header>

        <section className="dashboard-content">

          {/* WELCOME */}

          <div className="welcome-section">
            <div>
              <h2>Welcome back, Mentor 👋</h2>
              <p>Manage your interns, tasks and attendance.</p>
            </div>

            <div className="today-date">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* CREDENTIAL NOTICE */}

          {!credentialsAvailable && (
            <div className="notice-box">
              Configure VITE_DEV_USER_ID and VITE_DEV_ORG_ID
              in your client/.env file.
            </div>
          )}

          {error && (
            <div className="member-alert error">
              {error}
            </div>
          )}

          {message && (
            <div className="member-alert success">
              {message}
            </div>
          )}

          {/* STATISTICS */}

          <div className="stats-grid">
            <StatCard title="Total Tasks" value={stats.total} icon="▤" color="blue" />
            <StatCard title="Assigned" value={stats.assigned} icon="◷" color="orange" />
            <StatCard title="In Progress" value={stats.inProgress} icon="↗" color="purple" />
            <StatCard title="Submitted" value={stats.submitted} icon="◉" color="orange" />
            <StatCard title="Completed" value={stats.completed} icon="✓" color="green" />
          </div>

          {/* DASHBOARD */}

          {activeSection === "dashboard" && (
            <section className="tasks-card">
              <SectionHeading
                title="Recent Tasks"
                subtitle="Recently assigned tasks."
                onRefresh={fetchTasks}
              />

              <TaskTable
                tasks={filteredTasks.slice(0, 5)}
                loading={loading}
              />

              <button
                className="view-all-btn"
                onClick={() => navigate("tasks")}
              >
                View All Tasks →
              </button>
            </section>
          )}

          {/* TASKS */}

          {activeSection === "tasks" && (
            <section className="tasks-card">
              <SectionHeading
                title="All Assigned Tasks"
                subtitle="Manage tasks assigned to your interns."
                onRefresh={fetchTasks}
              />

              <div className="table-toolbar">
                <input
                  type="search"
                  placeholder="Search tasks or interns..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="ALL">All Status</option>

                  {[
                    "ASSIGNED",
                    "IN_PROGRESS",
                    "SUBMITTED",
                    "UNDER_REVIEW",
                    "COMPLETED",
                    "REJECTED",
                    "OVERDUE",
                    "EXPIRED",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <TaskTable tasks={filteredTasks} loading={loading} />
            </section>
          )}

          {/* ASSIGN TASK */}

          {activeSection === "assign" && (
            <section className="form-card">
              <SectionHeading
                title="Assign New Task"
                subtitle="Enter the details to assign a task to an intern."
              />

              <form onSubmit={handleAssignTask}>
                <div className="form-grid">

                  <FormField label="Intern ID">
                    <input
                      name="internId"
                      value={form.internId}
                      onChange={handleChange}
                      placeholder="Enter intern MongoDB ID"
                      required
                    />
                  </FormField>

                  <FormField label="Task Title">
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                    />
                  </FormField>

                  <FormField label="Task Code">
                    <input
                      name="taskCode"
                      value={form.taskCode}
                      onChange={handleChange}
                      placeholder="TASK-001"
                    />
                  </FormField>

                  <FormField label="Priority">
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </FormField>

                  <FormField label="Frequency">
                    <select
                      name="frequency"
                      value={form.frequency}
                      onChange={handleChange}
                    >
                      <option value="ONCE">Once</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </FormField>

                  <FormField label="Assigned Date">
                    <input
                      type="date"
                      name="assignedDate"
                      value={form.assignedDate}
                      onChange={handleChange}
                      required
                    />
                  </FormField>

                  <FormField label="Due Date">
                    <input
                      type="date"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={handleChange}
                      required
                    />
                  </FormField>

                  <div className="full-width">
                    <FormField label="Task Description">
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows="4"
                        required
                      />
                    </FormField>
                  </div>

                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => navigate("dashboard")}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={saving}
                  >
                    {saving ? "Assigning..." : "Assign Task"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* PROGRESS */}

          {activeSection === "progress" && (
            <section className="tasks-card">
              <SectionHeading
                title="Task Progress Overview"
                subtitle="Track the current status of assigned tasks."
                onRefresh={fetchTasks}
              />

              <ProgressItem title="Assigned" value={stats.assigned} total={stats.total} />
              <ProgressItem title="In Progress" value={stats.inProgress} total={stats.total} />
              <ProgressItem title="Submitted" value={stats.submitted} total={stats.total} />
              <ProgressItem title="Completed" value={stats.completed} total={stats.total} />

              <h3 className="progress-subtitle">Task Status Details</h3>

              <TaskTable tasks={filteredTasks} loading={loading} />
            </section>
          )}

          {/* SUBMISSION REVIEWS */}

          {activeSection === "submissions" && (
            <section className="tasks-card">

              <SectionHeading
                title="Submission Reviews"
                subtitle="Select a submitted task to review intern work."
                onRefresh={fetchTasks}
              />

              {tasks.filter(
                (task) => ["SUBMITTED", "UNDER_REVIEW"].includes(task.status)
              ).length === 0 ? (
                <div className="empty-state">
                  No pending submissions found.
                </div>
              ) : (
                <div className="member-task-list">
                  {tasks
                    .filter((task) =>
                      ["SUBMITTED", "UNDER_REVIEW"].includes(task.status)
                    )
                    .map((task) => (
                      <div className="member-task-row" key={task._id}>
                        <div>
                          <strong>{task.title}</strong>
                          <p>
                            Intern: {task.internId?.userId?.fullName || "Intern"}
                          </p>
                          <small>Due: {formatDate(task.dueDate)}</small>
                        </div>

                        <button
                          className="candidate-view-btn"
                          onClick={() => openSubmissions(task)}
                        >
                          Review Submission
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* SELECTED TASK SUBMISSIONS */}

              {selectedTask && (
                <div className="member-review-panel">
                  <h3>{selectedTask.title}</h3>

                  {loading ? (
                    <p>Loading submissions...</p>
                  ) : submissions.length === 0 ? (
                    <p>No submissions found for this task.</p>
                  ) : (
                    submissions.map((submission) => (
                      <div
                        className="member-submission-card"
                        key={submission._id}
                      >
                        <div className="member-submission-heading">
                          <div>
                            <strong>
                              {submission.internId?.userId?.fullName || "Intern"}
                            </strong>
                            <p>
                              Submitted: {formatDate(submission.submittedAt)}
                            </p>
                          </div>

                          <span className="task-status submitted">
                            {submission.reviewStatus}
                          </span>
                        </div>

                        <p className="member-submission-text">
                          {submission.submissionText}
                        </p>

                        {submission.submissionLinks?.length > 0 && (
                          <div className="member-links">
                            <strong>Project Links</strong>

                            {submission.submissionLinks.map((link) => (
                              <a
                                key={link}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {link}
                              </a>
                            ))}
                          </div>
                        )}

                        <p>
                          Attempt: {submission.attemptNumber}
                        </p>

                        {submission.reviewStatus === "PENDING" && (
                          <div className="member-review-form">
                            <h4>Evaluate Submission</h4>

                            <label>Review Decision</label>

                            <select
                              value={reviewForm.status}
                              onChange={(event) =>
                                setReviewForm({
                                  ...reviewForm,
                                  status: event.target.value,
                                })
                              }
                            >
                              <option value="APPROVED">Approve</option>
                              <option value="REJECTED">Reject</option>
                              <option value="REVISION_REQUIRED">
                                Request Revision
                              </option>
                            </select>

                            {reviewForm.status === "APPROVED" && (
                              <>
                                <label>Score (0–100)</label>

                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={reviewForm.score}
                                  onChange={(event) =>
                                    setReviewForm({
                                      ...reviewForm,
                                      score: event.target.value,
                                    })
                                  }
                                />
                              </>
                            )}

                            <label>Mentor Comment</label>

                            <textarea
                              rows="3"
                              value={reviewForm.mentorComment}
                              onChange={(event) =>
                                setReviewForm({
                                  ...reviewForm,
                                  mentorComment: event.target.value,
                                })
                              }
                              placeholder="Write feedback for the intern..."
                            />

                            <button
                              className="primary-btn"
                              disabled={saving}
                              onClick={() =>
                                reviewSubmission(submission._id)
                              }
                            >
                              {saving ? "Saving..." : "Submit Review"}
                            </button>
                          </div>
                        )}

                        {submission.reviewStatus !== "PENDING" && (
                          <div className="member-feedback">
                            <p>
                              Score: {submission.score ?? "Not provided"}
                            </p>
                            <p>
                              Mentor comment: {submission.mentorComment || "—"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          )}

          {/* ATTENDANCE */}

          {activeSection === "attendance" && (
            <section className="tasks-card">

              <SectionHeading
                title="Attendance Management"
                subtitle="Mark and review attendance for your assigned interns."
              />

              <form
                className="member-attendance-form"
                onSubmit={markAttendance}
              >
                <h3>Mark Intern Attendance</h3>

                <FormField label="Select Intern">
                  <select
                    name="internId"
                    value={attendanceForm.internId}
                    onChange={handleAttendanceChange}
                    required
                  >
                    <option value="">Select an intern</option>

                    {[
                      ...new Map(
                        tasks
                          .filter((task) => task.internId?._id)
                          .map((task) => [
                            task.internId._id,
                            task.internId,
                          ])
                      ).values(),
                    ].map((intern) => (
                      <option
                        key={intern._id}
                        value={intern._id}
                      >
                        {intern.userId?.fullName || intern._id}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Attendance Date">
                  <input
                    type="date"
                    name="attendanceDate"
                    value={attendanceForm.attendanceDate}
                    onChange={handleAttendanceChange}
                    required
                  />
                </FormField>

                <FormField label="Status">
                  <select
                    name="status"
                    value={attendanceForm.status}
                    onChange={handleAttendanceChange}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="LEAVE">Leave</option>
                  </select>
                </FormField>

                {!["ABSENT", "LEAVE"].includes(attendanceForm.status) && (
                  <>
                    <FormField label="Check-in Time">
                      <input
                        type="time"
                        name="checkIn"
                        value={attendanceForm.checkIn}
                        onChange={handleAttendanceChange}
                      />
                    </FormField>

                    <FormField label="Check-out Time">
                      <input
                        type="time"
                        name="checkOut"
                        value={attendanceForm.checkOut}
                        onChange={handleAttendanceChange}
                      />
                    </FormField>
                  </>
                )}

                <FormField label="Remarks">
                  <textarea
                    name="remarks"
                    value={attendanceForm.remarks}
                    onChange={handleAttendanceChange}
                    rows="2"
                  />
                </FormField>

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Mark Attendance"}
                </button>
              </form>

              <div className="member-attendance-records">
                <h3>Attendance Records</h3>

                <FormField label="Select intern to view records">
                  <select
                    value={attendanceForm.internId}
                    onChange={(event) => {
                      const internId = event.target.value;

                      setAttendanceForm({
                        ...attendanceForm,
                        internId,
                      });

                      fetchAttendance(internId);
                    }}
                  >
                    <option value="">Select an intern</option>

                    {[
                      ...new Map(
                        tasks
                          .filter((task) => task.internId?._id)
                          .map((task) => [
                            task.internId._id,
                            task.internId,
                          ])
                      ).values(),
                    ].map((intern) => (
                      <option
                        key={intern._id}
                        value={intern._id}
                      >
                        {intern.userId?.fullName || intern._id}
                      </option>
                    ))}
                  </select>
                </FormField>

                {attendanceSummary && (
                  <div className="member-summary-cards">
                    <div>
                      <small>Attendance</small>
                      <b>
                        {attendanceSummary.percentage ??
                          attendanceSummary.attendancePercentage ??
                          0}%
                      </b>
                    </div>

                    <div>
                      <small>Present</small>
                      <b>{attendanceSummary.present ?? 0}</b>
                    </div>

                    <div>
                      <small>Absent</small>
                      <b>{attendanceSummary.absent ?? 0}</b>
                    </div>

                    <div>
                      <small>Half Day</small>
                      <b>{attendanceSummary.halfDay ?? 0}</b>
                    </div>

                    <div>
                      <small>Leave</small>
                      <b>{attendanceSummary.leave ?? 0}</b>
                    </div>
                  </div>
                )}

                {loading ? (
                  <p>Loading attendance...</p>
                ) : attendance.length === 0 ? (
                  <p className="member-muted">
                    Select an intern to view attendance records.
                  </p>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Hours</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>

                      <tbody>
                        {attendance.map((record) => (
                          <tr key={record._id}>
                            <td>{formatDate(record.attendanceDate)}</td>
                            <td>{record.status}</td>
                            <td>
                              {record.checkIn
                                ? new Date(record.checkIn).toLocaleTimeString()
                                : "—"}
                            </td>
                            <td>
                              {record.checkOut
                                ? new Date(record.checkOut).toLocaleTimeString()
                                : "—"}
                            </td>
                            <td>{record.workingHours ?? 0}</td>
                            <td>{record.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

        </section>

        <footer className="footer">
          © {new Date().getFullYear()} InternCloud. Mentor Workspace.
        </footer>

      </main>
    </div>
  );
}

// =====================================
// REUSABLE COMPONENTS
// =====================================

function StatCard({ title, value, icon, color }) {
  return (
    <div className="stat-card">
      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>

      <div className={`stat-icon ${color}`}>
        {icon}
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle, onRefresh }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {onRefresh && (
        <button
          className="refresh-btn"
          onClick={onRefresh}
        >
          ↻ Refresh
        </button>
      )}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function TaskTable({ tasks, loading }) {
  if (loading) {
    return <div className="empty-state">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <h3>No tasks found</h3>
        <p>Assigned tasks will appear here.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Intern</th>
            <th>Priority</th>
            <th>Assigned Date</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => (
            <tr key={task._id}>
              <td>
                <strong>{task.title}</strong>
                <small>{task.taskCode || "No task code"}</small>
              </td>

              <td>
                {task.internId?.userId?.fullName || "Intern"}
              </td>

              <td>
                <span className={`priority ${task.priority?.toLowerCase()}`}>
                  {task.priority}
                </span>
              </td>

              <td>{formatDate(task.assignedDate)}</td>
              <td>{formatDate(task.dueDate)}</td>

              <td>
                <span className={`status ${task.status?.toLowerCase()}`}>
                  {task.status?.replaceAll("_", " ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressItem({ title, value, total }) {
  const percentage = total > 0
    ? Math.round((value / total) * 100)
    : 0;

  return (
    <div className="progress-item">
      <div className="progress-label">
        <strong>{title}</strong>
        <span>{value} / {total} ({percentage}%)</span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill blue-progress"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default App;