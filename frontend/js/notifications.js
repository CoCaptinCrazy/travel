import { api } from "./api.js";
import { emptyState, escapeHTML, pageHead } from "./helpers.js";

export function renderNotifications() {
  return `${pageHead("Inbox", "Notifications", "Updates for your TravelX account.")}<div id="notifications-list">${emptyState("Loading notifications…")}</div>`;
}

export async function bindNotifications() {
    try {
      const data = await api("/api/notifications");
      const target = document.querySelector("#notifications-list");
      if (!target) return;
      target.innerHTML = data.notifications.length ? `<div class="list">${data.notifications.map((item) => `<article class="list-item"><span>${escapeHTML(item.message)}</span><time class="small muted">${escapeHTML(item.created_at)}</time></article>`).join("")}</div>` : emptyState("You're all caught up.");
    } catch (error) {
      const target = document.querySelector("#notifications-list");
      if (target) target.innerHTML = emptyState(error.message);
    }
}
