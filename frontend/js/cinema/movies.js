import { api } from "../api.js";
import { escapeHTML, pageHead } from "../helpers.js";
import { bindReviews } from "./reviews.js";

export async function renderCinema() {
  try {
    const data = await api("/api/movies");
    return `${pageHead("Cinema", "Your watchlist starts here", "Browse local title metadata, save a watchlist, and share a review.")}<div class="button-row section-gap"><a class="button secondary small-button" href="#/watchlist">Open watchlist</a></div><div class="grid two">${data.movies.map((movie) => `<article class="card movie-card"><p class="eyebrow">${escapeHTML(movie.genre)} · ${movie.year}</p><h3>${escapeHTML(movie.title)}</h3><p>${escapeHTML(movie.description)}</p><p class="small"><span class="stars">★</span> ${movie.rating ?? "No ratings"} · ${movie.reviews} reviews</p><button class="button secondary small-button" type="button" data-watchlist="${escapeHTML(movie.id)}">${movie.saved ? "Saved to watchlist" : "Add to watchlist"}</button><form class="review-form" data-review-form="${escapeHTML(movie.id)}"><label class="field">Your rating<select class="select" name="rating" required><option value="">Choose rating…</option>${[1, 2, 3, 4, 5].map((rating) => `<option value="${rating}">${rating} / 5</option>`).join("")}</select></label><label class="field">Review (optional)<textarea class="textarea" name="review" maxlength="2000" rows="2"></textarea></label><button class="button small-button" type="submit">Save review</button><p class="form-success" data-review-status role="status"></p></form><div class="reviews" data-reviews="${escapeHTML(movie.id)}"></div></article>`).join("")}</div><p class="notice section-gap">These are sample metadata entries only. TravelX does not host or stream movie content.</p>`;
  } catch (error) {
    return `${pageHead("Cinema", "Cinema")}<div class="notice">${escapeHTML(error.message)}</div>`;
  }
}

export function bindCinema() {
  bindReviews();
  document.querySelectorAll("[data-watchlist]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.watchlist;
      const remove = button.textContent.startsWith("Saved");
      try {
        await api(`/api/watchlist/${id}`, { method: remove ? "DELETE" : "POST" });
        button.textContent = remove ? "Add to watchlist" : "Saved to watchlist";
      } catch (error) {
        button.textContent = error.message;
      }
    });
  });
}
