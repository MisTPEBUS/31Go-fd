"use strict";

async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(options.headers || {}),
    },

    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      data: result,
      message: result?.message || `API request failed: ${response.status}`,
    };
  }

  return result;
}
