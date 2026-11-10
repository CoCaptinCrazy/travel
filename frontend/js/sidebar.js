import { escapeHTML } from "./helpers.js";

const links = [
  ["dashboard", "⌂", "Dashboard"],
  ["orbit", "◉", "Orbit"],
  ["bookmarks", "☆", "Bookmarks"],
  ["history", "◷", "History"],
  ["arcade", "◇", "Arcade"],
  ["cinema", "▣", "Cinema"],
  ["pulse", "◌", "Pulse chat"],
  ["nova", "✧", "Nova AI"],
  ["music", "♫", "Music"],
  ["marketplace", "⬡", "Marketplace"],
  ["downloads", "↓", "Downloads"],
  ["profile", "●", "Profile"],
  ["settings", "⚙", "Settings"],
  ["admin", "▤", "Admin"],
];

export function sidebar(user, active) {
  const navigation = links.map(([route, icon, label]) =>
    `<a class="nav-link${active === route ? " active" : ""}" href="#/${route}"${active === route ? ' aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></a>`
  ).join("");
  return `<aside class="sidebar"><a class="brand" href="#/dashboard" aria-label="TravelX dashboard"><span class="brand-mark" aria-hidden="true">T</span><span>TravelX</span></a><p class="nav-label">Workspace</p><nav class="nav-list" aria-label="Main navigation">${navigation}</nav><div class="sidebar-bottom"><a class="nav-link${active === "store" ? " active" : ""}" href="#/store"><span class="nav-icon" aria-hidden="true">＋</span><span>Store</span></a><div class="user-chip">${user ? `Signed in as ${escapeHTML(user.username)}` : "Browsing as guest"}</div></div></aside>`;
}
