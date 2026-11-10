import { api } from "../api.js";
import { emptyState, escapeHTML, pageHead } from "../helpers.js";

export async function renderBookmarks() {
  const content = `${pageHead("Orbit browser", "Bookmarks", "Your saved web addresses.")}<form id="bookmark-form" class="card"><div class="grid two"><label class="field">Name<input class="input" name="title" maxlength="200" required /></label><label class="field">Web address<input class="input" name="url" type="url" placeholder="https://example.com" maxlength="2048" required /></label></div><button class="button" type="submit">Save bookmark</button><p class="form-error" id="bookmark-message" role="status"></p></form><section class="bookmark-list-section"><div id="bookmark-list">${emptyState("Loading bookmarks…")}</div></section>`;
  return content;
}

async function loadBookmarks() {
  const target = document.querySelector("#bookmark-list");
  try {
    const data = await api("/api/bookmarks");
    target.innerHTML = data.bookmarks.length ? `<div class="list">${data.bookmarks.map((item) => `<article class="list-item"><a class="list-item-main" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer"><span class="list-item-title">${escapeHTML(item.title)}</span><span class="list-item-subtitle">${escapeHTML(item.url)}</span></a><button class="button danger small-button" type="button" data-delete-bookmark="${item.id}">Remove</button></article>`).join("")}</div>` : emptyState("No bookmarks yet. Save one above or from the browser page.");
    target.querySelectorAll("[data-delete-bookmark]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await api(`/api/bookmarks/${button.dataset.deleteBookmark}`, { method: "DELETE" });
          await loadBookmarks();
        } catch (error) {
          target.innerHTML = emptyState(error.message);
        }
      });
    });
  } catch (error) {
    target.innerHTML = emptyState(error.message);
  }
}

export function bindBookmarks() {
  loadBookmarks();
  document.querySelector("#bookmark-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const message = document.querySelector("#bookmark-message");
    try {
      await api("/api/bookmarks", {
        method: "POST",
        body: { title: data.get("title"), url: data.get("url") },
      });
      form.reset();
      message.textContent = "Bookmark saved.";
      message.className = "form-success";
      await loadBookmarks();
    } catch (error) {
      message.textContent = error.message;
      message.className = "form-error";
    }
  });
}
