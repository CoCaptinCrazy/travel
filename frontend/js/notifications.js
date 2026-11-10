import { api } from "./api.js";
import { emptyState, escapeHTML, pageHead } from "./helpers.js";

export async function renderNotifications() {
  const content = `${pageHead("Inbox", "Notifications", "Updates for your TravelX account.")}<div id="notifications-list">${emptyState("Loading notifications…")}</div>`;
  queueMicrotask(async () => {
    try {
      const data = await api("/api/notifications");
      const target = document.querySelector("#notifications-list");
      target.innerHTML = data.notifications.length ? `<div class="list">${data.notifications.map((item) => `<article class="list-item"><span>${escapeHTML(item.message)}</span><time class="small muted">${escapeHTML(item.created_at)}</time></article>`).join("")}</div>` : emptyState("You're all caught up.");
    } catch (error) {
      const target = document.querySelector("#notifications-list");
      target.innerHTML = emptyState(error.message);
    }
  });
  return content;
}
