import { api } from "../api.js";
import { escapeHTML, pageHead } from "../helpers.js";
import { destinationFor } from "./engines.js";

const shortcuts = [
  ["Google", "Search the web", "G", "https://www.google.com/"],
  ["YouTube", "Watch videos", "▶", "https://www.youtube.com/"],
  ["Wikipedia", "Explore knowledge", "W", "https://www.wikipedia.org/"],
  ["GitHub", "Build something", "⌘", "https://github.com/"],
];

export function renderBrowser() {
  return `${pageHead("Orbit browser", "Where to next?", "Search for something or enter a website address. Pages open directly in a new browser tab.")}<form class="quick-search" id="orbit-form"><label class="visually-hidden" for="orbit-address">Search or enter an address</label><span aria-hidden="true">⌕</span><input id="orbit-address" name="address" placeholder="Search or enter an address" autocomplete="off" spellcheck="false" required /><button class="button" type="submit">Go ↗</button></form><p id="orbit-status" class="form-success" role="status" aria-live="polite"></p><div class="button-row orbit-subnav"><a class="button secondary small-button" href="#/bookmarks">Bookmarks</a><a class="button secondary small-button" href="#/history">History</a></div><div class="grid two">${shortcuts.map(([title, detail, icon, url]) => `<a class="card card-link" href="${url}" target="_blank" rel="noopener noreferrer"><span class="card-icon" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${detail}</p></a>`).join("")}</div>`;
}

export function bindBrowser(user) {
  const form = document.querySelector("#orbit-form");
  const status = document.querySelector("#orbit-status");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";
    try {
      const destination = destinationFor(new FormData(form).get("address"));
      window.open(destination.href, "_blank", "noopener,noreferrer");
      status.textContent = `Opening ${destination.hostname} in a new tab.`;
      if (user) {
        api("/api/history", {
          method: "POST",
          body: { title: destination.hostname, url: destination.href },
        }).catch((error) => {
          status.textContent = `Opened ${destination.hostname}. History could not be saved: ${error.message}`;
        });
      } else {
        status.textContent += " Sign in to save browsing history.";
      }
    } catch (error) {
      status.textContent = error.message;
      status.className = "form-error";
    }
  });
}
