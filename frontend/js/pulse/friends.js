import { api } from "../api.js";
import { escapeHTML } from "../helpers.js";

export async function renderFriends() {
  const data = await api("/api/friends");
  return data.friends.map((friend) => `<div class="list-item"><span>${escapeHTML(friend.username)} <small class="muted">${escapeHTML(friend.direction)} · ${escapeHTML(friend.status)}</small></span>${friend.direction === "incoming" && friend.status === "pending" ? `<button class="button secondary small-button" type="button" data-accept-friend="${friend.id}">Accept</button>` : ""}</div>`).join("") || `<div class="empty">No friend connections yet.</div>`;
}

export async function sendFriendRequest(username) {
  return api("/api/friends", { method: "POST", body: { username } });
}

export function bindFriendActions() {
  document.querySelectorAll("[data-accept-friend]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/api/friends/${button.dataset.acceptFriend}/accept`, { method: "PATCH", body: {} });
        button.textContent = "Accepted";
        button.disabled = true;
      } catch (error) {
        button.textContent = error.message;
      }
    });
  });
}
