const API_URL = import.meta.env.VITE_API_URL || "";

export const DEV_ROLE =
  import.meta.env.VITE_DEV_USER_ROLE || "MENTOR";

export const credentialsAvailable = Boolean(
  import.meta.env.VITE_DEV_USER_ID &&
  import.meta.env.VITE_DEV_ORG_ID
);

export function authHeaders(role = DEV_ROLE) {
  return {
    "Content-Type": "application/json",
    "x-user-id": import.meta.env.VITE_DEV_USER_ID || "",
    "x-org-id": import.meta.env.VITE_DEV_ORG_ID || "",
    "x-user-role": role,
  };
}

export async function apiRequest(path, options = {}, role = DEV_ROLE) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(role),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export function getErrorMessage(error) {
  return (
    error?.message ||
    "Something went wrong. Please try again."
  );
}