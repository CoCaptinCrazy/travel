import { escapeHTML } from "./helpers.js";

export function navbar(user) {
  return `<header class="topbar"><span class="topbar-title">Welcome${user ? `, ${escapeHTML(user.username)}` : " to TravelX"}</span><div class="topbar-actions"><a class="button secondary small-button" href="#/notifications">Notifications</a>${user ? `<button class="button secondary small-button" type="button" data-action="logout">Sign out</button>` : `<a class="button small-button" href="#/login">Sign in</a>`}</div></header>`;
}
