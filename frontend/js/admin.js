import { api } from "./api.js";
import { emptyState, escapeHTML, pageHead } from "./helpers.js";

export async function renderAdmin() {
  try {
    const [stats, users] = await Promise.all([api("/api/admin/stats"), api("/api/admin/users")]);
    return `${pageHead("Administration", "Workspace overview", "Account and activity counts for this local instance.")}<div class="stats">${Object.entries(stats).map(([label, count]) => `<div class="stat"><span>${escapeHTML(label)}</span><strong>${count}</strong></div>`).join("")}</div><section class="section-gap"><h2>Recent accounts</h2><div class="list">${users.users.length ? users.users.map((user) => `<article class="list-item"><span><strong>${escapeHTML(user.username)}</strong><small class="list-item-subtitle">${escapeHTML(user.created_at)}</small></span><span class="small muted">${escapeHTML(user.role)}</span></article>`).join("") : emptyState("No accounts yet.")}</div></section><p class="notice section-gap">Admin access is granted from the local command line; there is no public role-change endpoint.</p>`;
  } catch (error) {
    return `${pageHead("Administration", "Admin")}<div class="notice">${escapeHTML(error.message)}</div>`;
  }
}
