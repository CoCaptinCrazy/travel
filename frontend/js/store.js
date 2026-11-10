import { pageHead } from "./helpers.js";

export function renderStore() {
  return `${pageHead("TravelX", "Store", "Customize your own local workspace.")}<div class="grid two"><article class="card"><span class="card-icon" aria-hidden="true">◐</span><h3>Workspace themes</h3><p>Use the theme preference in Settings to switch between dark and light mode.</p><a class="button secondary" href="#/settings">Open settings</a></article><article class="card"><span class="card-icon" aria-hidden="true">＋</span><h3>Extensions</h3><p>Explore the sample extension catalog. This starter does not run arbitrary third-party code.</p><a class="button secondary" href="#/marketplace">Open marketplace</a></article></div>`;
}
