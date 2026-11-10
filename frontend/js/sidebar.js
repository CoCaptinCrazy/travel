import { escapeHTML } from "./helpers.js";

const links = [
  ["dashboard", "⌂", "Home"],
  ["arcade", "▧", "Games"],
  ["music", "♫", "Music"],
  ["pulse", "▢", "Chat"],
  ["nova", "✧", "AI"],
  ["cinema", "▣", "Cinema"],
  ["marketplace", "⬡", "Marketplace"],
  ["bookmarks", "☆", "Bookmarks"],
  ["history", "◷", "History"],
  ["downloads", "↓", "Downloads"],
  ["profile", "♙", "Profile"],
  ["admin", "▤", "Admin"],
  ["settings", "☷", "Settings"],
];

export function sidebar(user, active) {
  const navigation = links.map(([route, icon, label], index) =>
    `${index === 7 ? '<span class="rail-divider" aria-hidden="true"></span>' : ""}<a class="nav-link${active === route ? " active" : ""}" href="#/${route}" title="${label}" aria-label="${label}"${active === route ? ' aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></a>`
  ).join("");
  return `<aside class="sidebar"><a class="rail-home${active === "dashboard" ? " active" : ""}" href="#/dashboard" title="Home" aria-label="Home"><span aria-hidden="true">⌂</span></a><nav class="nav-list" aria-label="Main navigation">${navigation}</nav><div class="sidebar-bottom"><a class="nav-link${active === "store" ? " active" : ""}" href="#/store" title="Store" aria-label="Store"><span class="nav-icon" aria-hidden="true">＋</span><span>Store</span></a><div class="user-chip">${user ? escapeHTML(user.username) : "Guest"}</div></div></aside>`;
}
