import { api } from "../api.js";
import { emptyState, escapeHTML, pageHead } from "../helpers.js";

export async function renderHistory() {
  const content = `${pageHead("Orbit browser", "Browsing history", "Your recent addresses opened from TravelX.")}<div class="button-row history-actions"><button class="button danger small-button" id="clear-history" type="button">Clear history</button></div><div id="history-list">${emptyState("Loading history…")}</div>`;
  queueMicrotask(loadHistory);
  return content;
}

async function loadHistory() {
  const target = document.querySelector("#history-list");
  try {
    const data = await api("/api/history");
    target.innerHTML = data.history.length ? `<div class="list">${data.history.map((item) => `<a class="list-item" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer"><span class="list-item-main"><span class="list-item-title">${escapeHTML(item.title)}</span><span class="list-item-subtitle">${escapeHTML(item.url)}</span></span><time class="small muted">${escapeHTML(item.visited_at)}</time></a>`).join("")}</div>` : emptyState("Your browsing history is empty.");
  } catch (error) {
    target.innerHTML = emptyState(error.message);
  }
}

export function bindHistory() {
  document.querySelector("#clear-history")?.addEventListener("click", async () => {
    const button = document.querySelector("#clear-history");
    button.disabled = true;
    try {
      await api("/api/history", { method: "DELETE" });
      await loadHistory();
    } catch (error) {
      document.querySelector("#history-list").innerHTML = emptyState(error.message);
    } finally {
      button.disabled = false;
    }
  });
}
