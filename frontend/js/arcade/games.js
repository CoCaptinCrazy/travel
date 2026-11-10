import { api } from "../api.js";
import { emptyState, escapeHTML, pageHead } from "../helpers.js";
import { getFavorites, toggleFavorite } from "./favorites.js";
import { ratingControl } from "./ratings.js";

export async function renderArcade(showFavorites = false) {
  let games;
  try {
    ({ games } = await api("/api/games"));
  } catch (error) {
    return `${pageHead("Arcade", "Small breaks, right here")}<div class="notice">${escapeHTML(error.message)}</div>`;
  }
  const favoriteIds = new Set(getFavorites());
  const visible = showFavorites ? games.filter((game) => favoriteIds.has(game.id)) : games;
  return `${pageHead("Arcade", showFavorites ? "Favorite games" : "Arcade", "A tiny local game and a catalog ready for your licensed additions.")}<div class="grid two"><article class="card"><p class="eyebrow">Playable now</p><h2>Number Guess</h2><p>Find the hidden number from 1 to 20 in six tries.</p><p class="game-number" id="guess-count" aria-live="polite">?</p><form class="button-row" id="guess-form"><label class="visually-hidden" for="guess-input">Your guess from 1 to 20</label><input class="input guess-input" id="guess-input" type="number" min="1" max="20" required /><button class="button" type="submit">Guess</button><button class="button secondary" id="guess-reset" type="button">New round</button></form><p id="guess-status" role="status" aria-live="polite"></p></article><article class="card"><p class="eyebrow">Local catalog</p><h2>Bring your own catalog</h2><p>TravelX includes a sample listing. Add games you have permission to distribute; no third-party game content is bundled here.</p><a class="button secondary" href="#/store">Explore extensions</a></article></div><section class="section-gap"><div class="button-row"><h2 class="section-title">Game library</h2><a class="button secondary small-button" href="#/favorites">Favorites (${favoriteIds.size})</a></div><div class="grid two">${visible.length ? visible.map((game) => `<article class="card"><p class="eyebrow">${escapeHTML(game.category)}</p><h3>${escapeHTML(game.title)}</h3><p>${escapeHTML(game.description)}</p><p class="small"><span class="stars">★</span> ${game.rating ?? "No ratings"} · ${game.ratings} ratings</p><div class="game-actions"><button class="button secondary small-button" type="button" data-favorite="${escapeHTML(game.id)}">${favoriteIds.has(game.id) ? "★ Favorited" : "☆ Favorite"}</button>${ratingControl(game.id)}</div><p class="form-success" data-rating-status="${escapeHTML(game.id)}" role="status"></p></article>`).join("") : emptyState("No favorite games yet.")}</div></section>`;
}

export function bindArcade() {
  let target = Math.floor(Math.random() * 20) + 1;
  let attempts = 0;
  let finished = false;
  const guessForm = document.querySelector("#guess-form");
  const status = document.querySelector("#guess-status");
  const count = document.querySelector("#guess-count");
  const input = document.querySelector("#guess-input");
  const reset = () => {
    target = Math.floor(Math.random() * 20) + 1;
    attempts = 0;
    finished = false;
    count.textContent = "?";
    status.textContent = "Pick a number from 1 to 20.";
    input.disabled = false;
    guessForm.querySelector("button[type=submit]").disabled = false;
    guessForm.reset();
  };
  reset();
  guessForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (finished) return;
    const guess = Number(input.value);
    if (!Number.isInteger(guess) || guess < 1 || guess > 20) {
      status.textContent = "Enter a whole number from 1 to 20.";
      return;
    }
    attempts += 1;
    if (guess === target) {
      status.textContent = `You got it in ${attempts} ${attempts === 1 ? "try" : "tries"}!`;
      count.textContent = String(target);
      finished = true;
    } else if (attempts >= 6) {
      status.textContent = `Out of tries — the number was ${target}. Start a new round.`;
      count.textContent = String(target);
      finished = true;
    } else {
      status.textContent = `${guess < target ? "Higher" : "Lower"} — ${6 - attempts} tries left.`;
    }
    if (finished) {
      input.disabled = true;
      guessForm.querySelector("button[type=submit]").disabled = true;
    }
  });
  document.querySelector("#guess-reset")?.addEventListener("click", reset);

  document.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", async () => {
      toggleFavorite(button.dataset.favorite);
      if (location.hash === "#/favorites") {
        button.closest(".card")?.remove();
        if (!document.querySelector("[data-favorite]")) {
          document.querySelector(".grid.two:last-of-type").innerHTML = emptyState("No favorite games yet.");
        }
      } else {
        button.textContent = getFavorites().includes(button.dataset.favorite) ? "★ Favorited" : "☆ Favorite";
      }
    });
  });

  document.querySelectorAll("[data-rating-for]").forEach((select) => {
    select.addEventListener("change", async () => {
      if (!select.value) return;
      const gameId = select.dataset.ratingFor;
      const message = document.querySelector(`[data-rating-status="${gameId}"]`);
      try {
        await api(`/api/games/${gameId}/rating`, {
          method: "POST",
          body: { rating: Number(select.value) },
        });
        message.textContent = "Rating saved.";
      } catch (error) {
        message.textContent = error.message;
      }
    });
  });
}
