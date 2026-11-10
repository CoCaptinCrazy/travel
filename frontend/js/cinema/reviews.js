import { api } from "../api.js";
import { escapeHTML } from "../helpers.js";

export async function loadReviews(movieId) {
  const target = document.querySelector(`[data-reviews="${movieId}"]`);
  try {
    const data = await api(`/api/movies/${movieId}/reviews`);
    target.innerHTML = data.reviews.length
      ? data.reviews.map((review) => `<div class="review"><span class="stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span><strong>${escapeHTML(review.username)}</strong><p>${escapeHTML(review.review || "Rated this title.")}</p></div>`).join("")
      : `<p class="small muted">No reviews yet.</p>`;
  } catch (error) {
    target.textContent = error.message;
  }
}

export function bindReviews() {
  document.querySelectorAll("[data-review-form]").forEach((form) => {
    const movieId = form.dataset.reviewForm;
    loadReviews(movieId);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const status = form.querySelector("[data-review-status]");
      try {
        await api(`/api/movies/${movieId}/reviews`, {
          method: "POST",
          body: { rating: Number(data.get("rating")), review: data.get("review") },
        });
        status.textContent = "Review saved.";
        await loadReviews(movieId);
      } catch (error) {
        status.textContent = error.message;
      }
    });
  });
}
