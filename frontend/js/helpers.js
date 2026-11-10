export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export function pageHead(label, title, description = "") {
  return `<header class="page-head"><p class="eyebrow">${escapeHTML(label)}</p><h1>${escapeHTML(title)}</h1>${description ? `<p class="lead">${escapeHTML(description)}</p>` : ""}</header>`;
}

export function showMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.className = isError ? "form-error" : "form-success";
}

export function emptyState(message) {
  return `<div class="empty">${escapeHTML(message)}</div>`;
}
