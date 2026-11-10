import { pageHead } from "./helpers.js";

const services = [
  ["YouTube Music", "Listen to music on YouTube Music.", "https://music.youtube.com/"],
  ["Spotify", "Open Spotify in your browser.", "https://open.spotify.com/"],
  ["SoundCloud", "Discover music on SoundCloud.", "https://soundcloud.com/"],
];

export function renderMusic() {
  return `${pageHead("Listen", "Music", "Choose a music service you already use.")}<div class="grid">${services.map(([title, detail, href]) => `<a class="card card-link" href="${href}" target="_blank" rel="noopener noreferrer"><span class="card-icon" aria-hidden="true">♫</span><h3>${title}</h3><p>${detail}</p><p class="small muted">Opens directly in a new tab ↗</p></a>`).join("")}</div><p class="notice section-gap">TravelX does not host or stream music.</p>`;
}
