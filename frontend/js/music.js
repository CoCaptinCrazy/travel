import { escapeHTML, pageHead } from "./helpers.js";

const services = [
  ["YouTube Music", "Open YouTube Music or embed a public video or playlist.", "https://music.youtube.com/"],
  ["Spotify", "Open Spotify or embed a public track, album, or playlist.", "https://open.spotify.com/"],
  ["SoundCloud", "Open SoundCloud or embed a public track or playlist.", "https://soundcloud.com/"],
];

export function providerEmbed(value) {
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    throw new Error("Enter a valid public link from Spotify, YouTube Music, or SoundCloud.");
  }
  if (url.protocol !== "https:") {
    throw new Error("Music embeds must use a secure HTTPS link.");
  }
  if (url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("Use a standard public link without embedded credentials.");
  }
  if (url.hostname === "open.spotify.com") {
    const match = url.pathname.match(/^\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)\/?$/);
    if (!match) throw new Error("Use a public Spotify track, album, playlist, episode, or show link.");
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }
  if (["music.youtube.com", "youtube.com", "www.youtube.com", "youtu.be"].includes(url.hostname)) {
    const playlist = url.searchParams.get("list");
    if (playlist && /^[A-Za-z0-9_-]+$/.test(playlist)
        && ["/playlist", "/watch"].includes(url.pathname)) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlist)}`;
    }
    const videoId = url.hostname === "youtu.be"
      ? url.pathname.slice(1)
      : url.searchParams.get("v");
    if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)
        && (url.hostname === "youtu.be" || ["/watch", "/shorts"].includes(url.pathname))) {
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    throw new Error("Use a public YouTube Music video or playlist link.");
  }
  if (["soundcloud.com", "www.soundcloud.com"].includes(url.hostname)
      && url.pathname.split("/").filter(Boolean).length >= 2) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&auto_play=false`;
  }
  throw new Error("Only Spotify, YouTube Music, and SoundCloud links can be embedded.");
}

export function renderMusic() {
  return `${pageHead("Listen", "Music", "Play public tracks and playlists in official provider players.")}<section class="music-embed-card card"><p class="eyebrow">Embed a public link</p><form id="music-embed-form" class="music-embed-form"><label class="visually-hidden" for="music-url">Spotify, YouTube Music, or SoundCloud link</label><input class="input" id="music-url" name="url" type="url" placeholder="Paste a public track or playlist link…" required /><button class="button" type="submit">Load player</button></form><p id="music-status" class="form-error" role="status" aria-live="polite"></p><div id="music-player" class="music-player" hidden></div></section><h2 class="section-title section-gap">Music services</h2><div class="grid">${services.map(([title, detail, href]) => `<a class="card card-link" href="${href}" target="_blank" rel="noopener noreferrer"><span class="card-icon" aria-hidden="true">♫</span><h3>${escapeHTML(title)}</h3><p>${escapeHTML(detail)}</p><p class="small muted">Open service ↗</p></a>`).join("")}</div><p class="notice section-gap">TravelX embeds public content using official players; availability and playback depend on each provider. API credentials are optional and are not needed for these embeds. TravelX does not host or download music.</p>`;
}

export function bindMusic() {
  document.querySelector("#music-embed-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("#music-status");
    const player = document.querySelector("#music-player");
    try {
      const source = providerEmbed(new FormData(form).get("url"));
      const frame = document.createElement("iframe");
      frame.title = "Music provider player";
      frame.src = source;
      frame.loading = "lazy";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.allow = "autoplay; encrypted-media; picture-in-picture";
      frame.allowFullscreen = true;
      player.replaceChildren(frame);
      player.hidden = false;
      status.textContent = "";
      status.className = "form-success";
    } catch (error) {
      player.replaceChildren();
      player.hidden = true;
      status.textContent = error.message;
      status.className = "form-error";
    }
  });
}
