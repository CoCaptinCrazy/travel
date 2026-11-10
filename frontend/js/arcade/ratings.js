export function ratingControl(gameId, value = 0) {
  return `<label class="field">Your rating<select class="select" data-rating-for="${gameId}"><option value="">Rate this game…</option>${[1, 2, 3, 4, 5].map((rating) => `<option value="${rating}"${rating === value ? " selected" : ""}>${rating} / 5</option>`).join("")}</select></label>`;
}
