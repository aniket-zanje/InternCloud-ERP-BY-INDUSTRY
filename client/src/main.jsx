import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App.jsx";
import CandidateDashboard from "./CandidateDashboard.jsx";

import { DEV_ROLE } from "./api.js";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    {DEV_ROLE === "CANDIDATE" ? (
      <CandidateDashboard />
    ) : (
      <App />
    )}
  </React.StrictMode>
);