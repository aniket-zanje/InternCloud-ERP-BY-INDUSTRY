import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./CandidateDashboard.css";
import "./Member3.css";

import {
  apiRequest,
  credentialsAvailable,
  formatDate,
  getErrorMessage,
} from "./api.js";

export default function CandidateDashboard() {
  const [section, setSection] = useState("tasks");

  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [selectedTask, setSelectedTask] = useState(null);

  const [submissionText, setSubmissionText] = useState("");
  const [submissionLinks, setSubmissionLinks] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // -------------------------------
  // FETCH CANDIDATE TASKS
  // -------------------------------

  const fetchTasks = useCallback(async () => {
    if (!credentialsAvailable) {
      setError(
        "Set VITE_DEV_USER_ID and VITE_DEV_ORG_ID in client/.env to connect your candidate account."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        "/api/tasks/my",
        {},
        "CANDIDATE"
      );

      setTasks(data.tasks || []);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------
  // FETCH CANDIDATE ATTENDANCE
  // -------------------------------

  const fetchAttendance = useCallback(async () => {
    if (!credentialsAvailable) return;

    setLoading(true);
    setError("");

    try {
      const [records, summary] = await Promise.all([
        apiRequest(
          "/api/attendance/my",
          {},
          "CANDIDATE"
        ),

        apiRequest(
          "/api/attendance/summary/my",
          {},
          "CANDIDATE"
        ),
      ]);

      setAttendance(
        records.attendance || records.records || []
      );

      setAttendanceSummary(
        summary.summary || summary
      );
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------
  // INITIAL LOAD
  // -------------------------------

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (section === "attendance") {
      fetchAttendance();
    }
  }, [section, fetchAttendance]);

  // -------------------------------
  // TASK FILTERING
  // -------------------------------

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        `${task.title || ""} ${task.description || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "ALL" || task.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  // -------------------------------
  // TASK COUNTS
  // -------------------------------

  const counts = {
    total: tasks.length,

    assigned: tasks.filter(
      (task) => task.status === "ASSIGNED"
    ).length,

    progress: tasks.filter(
      (task) => task.status === "IN_PROGRESS"
    ).length,

    submitted: tasks.filter(
      (task) =>
        ["SUBMITTED", "UNDER_REVIEW"].includes(task.status)
    ).length,

    completed: tasks.filter(
      (task) => task.status === "COMPLETED"
    ).length,
  };

  // -------------------------------
  // START TASK
  // -------------------------------

  async function startTask(id) {
    setSubmitting(true);
    setError("");

    try {
      await apiRequest(
        `/api/tasks/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "IN_PROGRESS",
          }),
        },
        "CANDIDATE"
      );

      setSelectedTask(null);

      await fetchTasks();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------
  // SUBMIT COMPLETED TASK
  // -------------------------------

  async function submitTask(id) {
    if (!submissionText.trim()) {
      setError("Please describe your completed work.");
      return;
    }

    const links = submissionLinks
      .split("\n")
      .map((link) => link.trim())
      .filter(Boolean);

    for (const link of links) {
      try {
        const url = new URL(link);

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error();
        }
      } catch {
        setError(`Invalid URL: ${link}`);
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      await apiRequest(
        `/api/submissions/tasks/${id}`,
        {
          method: "POST",
          body: JSON.stringify({
            submissionText: submissionText.trim(),
            submissionLinks: links,
          }),
        },
        "CANDIDATE"
      );

      setSubmissionText("");
      setSubmissionLinks("");
      setSelectedTask(null);

      await fetchTasks();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------
  // OPEN TASK DETAILS
  // -------------------------------

  async function loadHistory(task) {
    setSelectedTask(task);
    setHistory([]);
    setHistoryLoading(false);
  }

  // -------------------------------
  // UI
  // -------------------------------

  return (
    <div className="candidate-dashboard candidate-workspace">

      {/* HEADER */}

      <header className="candidate-header">
        <div>
          <p className="candidate-eyebrow">
            CANDIDATE PORTAL
          </p>

          <h1>
            {section === "tasks"
              ? "My Tasks"
              : "My Attendance"}
          </h1>

          <p className="candidate-subtitle">
            Track assigned work, submission feedback and attendance.
          </p>
        </div>

        <div className="member-header-actions">
          <button
            className="candidate-refresh"
            onClick={
              section === "tasks"
                ? fetchTasks
                : fetchAttendance
            }
          >
            ↻ Refresh
          </button>

          <button
            className="candidate-refresh"
            onClick={() =>
              setSection(
                section === "tasks"
                  ? "attendance"
                  : "tasks"
              )
            }
          >
            {section === "tasks"
              ? "View Attendance"
              : "View My Tasks"}
          </button>
        </div>
      </header>

      {/* MISSING CREDENTIALS */}

      {!credentialsAvailable && (
        <div className="notice-box">
          <b>Development credentials are missing.</b>

          <p>
            Set VITE_DEV_USER_ID and VITE_DEV_ORG_ID
            in client/.env to valid candidate and
            organization IDs.
          </p>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="member-alert error">
          {error}
        </div>
      )}

      {/* ================================== */}
      {/* TASKS SECTION */}
      {/* ================================== */}

      {section === "tasks" && (
        <>
          {/* STATISTICS */}

          <section className="candidate-stats">

            {[
              ["Total Tasks", counts.total, "purple"],
              ["Assigned", counts.assigned, "orange"],
              ["In Progress", counts.progress, "blue"],
              ["Submitted", counts.submitted, "orange"],
              ["Completed", counts.completed, "green"],
            ].map(([label, value, color]) => (
              <div
                className="candidate-stat-card"
                key={label}
              >
                <span className={`stat-icon ${color}`}>
                  ▣
                </span>

                <div>
                  <p>{label}</p>
                  <h2>{value}</h2>
                </div>
              </div>
            ))}

          </section>

          {/* TASK TABLE */}

          <section className="candidate-task-section">

            <div className="candidate-section-heading">
              <div>
                <h2>My Assigned Tasks</h2>

                <p>
                  Tasks assigned to you by your mentor.
                </p>
              </div>
            </div>

            {/* SEARCH AND FILTER */}

            <div className="candidate-toolbar">

              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
              >
                <option value="ALL">All Tasks</option>

                {[
                  "ASSIGNED",
                  "IN_PROGRESS",
                  "SUBMITTED",
                  "COMPLETED",
                  "REJECTED",
                  "OVERDUE",
                  "EXPIRED",
                ].map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>

            </div>

            {/* LOADING */}

            {loading ? (
              <div className="candidate-message">
                Loading your tasks...
              </div>
            ) : filtered.length === 0 ? (
              <div className="candidate-empty">
                <h3>No tasks found</h3>

                <p>
                  Your mentor's assigned tasks will appear here.
                </p>
              </div>
            ) : (

              <div className="candidate-table-wrapper">

                <table className="candidate-table">

                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Priority</th>
                      <th>Assigned</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filtered.map((task) => (
                      <tr key={task._id}>

                        <td>
                          <strong>{task.title}</strong>

                          <small>
                            {task.description?.slice(0, 70)}
                            {task.description?.length > 70
                              ? "…"
                              : ""}
                          </small>
                        </td>

                        <td>
                          <span
                            className={`priority-badge ${task.priority?.toLowerCase()}`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        <td>
                          {formatDate(task.assignedDate)}
                        </td>

                        <td>
                          {formatDate(task.dueDate)}
                        </td>

                        <td>
                          <span
                            className={`task-status ${task.status?.toLowerCase()}`}
                          >
                            {task.status?.replaceAll("_", " ")}
                          </span>
                        </td>

                        <td>
                          <button
                            className="candidate-view-btn"
                            onClick={() => {
                              setSubmissionText("");
                              setSubmissionLinks("");
                              loadHistory(task);
                            }}
                          >
                            View Details
                          </button>
                        </td>

                      </tr>
                    ))}

                  </tbody>
                </table>

              </div>
            )}

          </section>
        </>
      )}

      {/* ================================== */}
      {/* ATTENDANCE SECTION */}
      {/* ================================== */}

      {section === "attendance" && (
        <section className="tasks-card">

          <div className="section-heading">
            <div>
              <h2>My Attendance Summary</h2>

              <p>
                Your attendance recorded by your mentor.
              </p>
            </div>
          </div>

          {/* SUMMARY CARDS */}

          {attendanceSummary && (
            <div className="member-summary-cards">

              {[
                [
                  "Attendance",
                  `${
                    attendanceSummary.percentage ??
                    attendanceSummary.attendancePercentage ??
                    0
                  }%`,
                ],
                ["Present", attendanceSummary.present ?? 0],
                ["Absent", attendanceSummary.absent ?? 0],
                ["Half day", attendanceSummary.halfDay ?? 0],
                ["Leave", attendanceSummary.leave ?? 0],
              ].map(([label, value]) => (
                <div key={label}>
                  <small>{label}</small>
                  <b>{value}</b>
                </div>
              ))}

            </div>
          )}

          {/* ATTENDANCE TABLE */}

          {loading ? (
            <p>Loading attendance...</p>
          ) : attendance.length === 0 ? (
            <p className="member-muted">
              No attendance records found.
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
                    <th>Working Hours</th>
                    <th>Remarks</th>
                  </tr>
                </thead>

                <tbody>

                  {attendance.map((record) => (
                    <tr key={record._id}>

                      <td>
                        {formatDate(record.attendanceDate)}
                      </td>

                      <td>{record.status}</td>

                      <td>
                        {record.checkIn
                          ? new Date(
                              record.checkIn
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      <td>
                        {record.checkOut
                          ? new Date(
                              record.checkOut
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      <td>
                        {record.workingHours ?? 0}
                      </td>

                      <td>
                        {record.remarks || "—"}
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>

            </div>
          )}

        </section>
      )}

      {/* ================================== */}
      {/* TASK DETAILS MODAL */}
      {/* ================================== */}

      {selectedTask && (
        <div
          className="candidate-modal-overlay"
          onClick={() => setSelectedTask(null)}
        >

          <div
            className="candidate-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <button
              className="candidate-close"
              onClick={() => setSelectedTask(null)}
            >
              ×
            </button>

            <p className="candidate-eyebrow">
              TASK DETAILS
            </p>

            <h2>{selectedTask.title}</h2>

            <p className="candidate-description">
              {selectedTask.description}
            </p>

            {/* TASK DETAILS */}

            <div className="candidate-detail-grid">

              <div>
                <span>Priority</span>
                <strong>{selectedTask.priority}</strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  {selectedTask.status?.replaceAll("_", " ")}
                </strong>
              </div>

              <div>
                <span>Assigned</span>

                <strong>
                  {formatDate(selectedTask.assignedDate)}
                </strong>
              </div>

              <div>
                <span>Deadline</span>

                <strong>
                  {formatDate(selectedTask.dueDate)}
                </strong>
              </div>

            </div>

            {/* START TASK */}

            {selectedTask.status === "ASSIGNED" && (
              <button
                className="candidate-start-btn"
                disabled={submitting}
                onClick={() => startTask(selectedTask._id)}
              >
                {submitting
                  ? "Starting..."
                  : "Start Task"}
              </button>
            )}

            {/* SUBMISSION FORM */}

            {selectedTask.status === "IN_PROGRESS" && (
              <div className="submission-form">

                <h3>Submit Completed Work</h3>

                <label>
                  Work Description *
                </label>

                <textarea
                  rows="5"
                  value={submissionText}
                  onChange={(event) =>
                    setSubmissionText(event.target.value)
                  }
                  placeholder="Describe what you completed..."
                />

                <label>
                  Project Links (one URL per line)
                </label>

                <textarea
                  rows="3"
                  value={submissionLinks}
                  onChange={(event) =>
                    setSubmissionLinks(event.target.value)
                  }
                  placeholder="https://github.com/username/project"
                />

                <button
                  className="candidate-start-btn"
                  disabled={submitting}
                  onClick={() => submitTask(selectedTask._id)}
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit for Review"}
                </button>

              </div>
            )}

            {/* SUBMISSION FEEDBACK */}

            <div className="member-history">

              <h3>
                Submission Status & Mentor Feedback
              </h3>

              <p>
                Your current task status is shown above.
                The existing backend only allows mentors
                to read submission history. A candidate-owned
                history endpoint is still needed before
                score and mentor comments can be displayed here.
              </p>

            </div>

            {/* STATUS MESSAGES */}

            {selectedTask.status === "SUBMITTED" && (
              <div className="candidate-info">
                Your submission is waiting for mentor review.
              </div>
            )}

            {selectedTask.status === "COMPLETED" && (
              <div className="candidate-success">
                ✓ Your task has been approved.
              </div>
            )}

            {selectedTask.status === "REJECTED" && (
              <div className="candidate-error">
                Your submission was rejected.
                Please contact your mentor.
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}