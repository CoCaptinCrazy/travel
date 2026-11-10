import { api } from "../api.js";
import { emptyState, escapeHTML, pageHead } from "../helpers.js";

export async function renderWatchlist() {
  try {
    const data = await api("/api/watchlist");
    return `${pageHead("Cinema", "Watchlist", "Titles you saved for later.")}<div class="grid two">${data.watchlist.length ? data.watchlist.map((movie) => `<article class="card"><p class="eyebrow">${escapeHTML(movie.genre)} · ${movie.year}</p><h3>${escapeHTML(movie.title)}</h3><p>${escapeHTML(movie.description)}</p><button class="button danger small-button" type="button" data-watchlist-remove="${escapeHTML(movie.id)}">Remove</button></article>`).join("") : emptyState("Your watchlist is empty. Add a title from Cinema.")}</div>`;
  } catch (error) {
    return `${pageHead("Cinema", "Watchlist")}<div class="notice">${escapeHTML(error.message)}</div>`;
  }
}

export function bindWatchlist() {
  document.querySelectorAll("[data-watchlist-remove]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/api/watchlist/${button.dataset.watchlistRemove}`, { method: "DELETE" });
        button.closest(".card").remove();
        if (!document.querySelector("[data-watchlist-remove]")) {
          document.querySelector(".grid").innerHTML = emptyState("Your watchlist is empty. Add a title from Cinema.");
        }
      } catch (error) {
        button.textContent = error.message;
      }
    });
  });
}
