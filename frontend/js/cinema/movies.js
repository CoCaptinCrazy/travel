import { api } from "../api.js";
import { emptyState, escapeHTML, pageHead } from "../helpers.js";
import { bindReviews } from "./reviews.js";

function renderMovies(movies) {
  if (!movies.length) return emptyState("No movies matched that search.");
  return `<div class="grid two">${movies.map((movie) => {
    const trailerQuery = encodeURIComponent(`${movie.title} ${movie.year || ""} official trailer`);
    const poster = movie.posterUrl
      ? `<img class="movie-poster" src="${escapeHTML(movie.posterUrl)}" alt="Poster for ${escapeHTML(movie.title)}" loading="lazy" />`
      : `<div class="movie-poster movie-poster-placeholder" aria-hidden="true">CINEMA</div>`;
    return `<article class="card movie-card">${poster}<div class="movie-card-content"><p class="eyebrow">${escapeHTML(movie.genre)}${movie.year ? ` · ${movie.year}` : ""}</p><h3>${escapeHTML(movie.title)}</h3><p>${escapeHTML(movie.description)}</p><p class="small"><span class="stars">★</span> ${movie.rating ?? "No ratings"} · ${movie.reviews} reviews</p><div class="button-row"><button class="button secondary small-button" type="button" data-watchlist="${escapeHTML(movie.id)}">${movie.saved ? "Saved to watchlist" : "Add to watchlist"}</button><a class="button secondary small-button" href="https://www.youtube.com/results?search_query=${trailerQuery}" target="_blank" rel="noopener noreferrer">Find trailer ↗</a></div><form class="review-form" data-review-form="${escapeHTML(movie.id)}"><label class="field">Your rating<select class="select" name="rating" required><option value="">Choose rating…</option>${[1, 2, 3, 4, 5].map((rating) => `<option value="${rating}">${rating} / 5</option>`).join("")}</select></label><label class="field">Review (optional)<textarea class="textarea" name="review" maxlength="2000" rows="2"></textarea></label><button class="button small-button" type="submit">Save review</button><p class="form-success" data-review-status role="status"></p></form><div class="reviews" data-reviews="${escapeHTML(movie.id)}"></div></div></article>`;
  }).join("")}</div>`;
}

export async function renderCinema() {
  try {
    const data = await api("/api/movies");
    const catalogNote = data.catalog === "TMDB"
      ? "Movie metadata by TMDB. TravelX links to official trailer search results; it does not host or stream films."
      : "Add a TMDB API key in .env to browse live movie metadata. TravelX does not host or stream films.";
    return `${pageHead("Cinema", "Movies for later", "Search the catalog, save a watchlist, and share a review.")}<div class="cinema-toolbar"><form class="cinema-search" id="movie-search"><label class="visually-hidden" for="movie-query">Search movies</label><input class="input" id="movie-query" name="query" type="search" maxlength="100" placeholder="Search movies…" /><button class="button" type="submit">Search</button></form><a class="button secondary small-button" href="#/watchlist">Open watchlist</a></div><p class="small muted" id="movie-status" role="status">${escapeHTML(data.catalog === "TMDB" ? "Live TMDB catalog" : "Sample catalog")}</p><div id="movie-results">${renderMovies(data.movies)}</div><p class="notice section-gap">${catalogNote} This product uses the TMDB API but is not endorsed or certified by TMDB.</p>`;
  } catch (error) {
    return `${pageHead("Cinema", "Movies for later")}<div class="notice">${escapeHTML(error.message)}</div>`;
  }
}

function bindMovieActions() {
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

export function bindCinema() {
  bindMovieActions();
  document.querySelector("#movie-search")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const query = new FormData(form).get("query").trim();
    const status = document.querySelector("#movie-status");
    const results = document.querySelector("#movie-results");
    status.className = "small muted";
    status.textContent = "Searching…";
    try {
      const data = await api(`/api/movies?q=${encodeURIComponent(query)}`);
      results.innerHTML = renderMovies(data.movies);
      status.textContent = data.catalog === "TMDB" ? "Live TMDB catalog" : "Sample catalog";
      bindMovieActions();
    } catch (error) {
      results.textContent = "";
      status.textContent = error.message;
      status.className = "form-error";
    }
  });
}
