import { escapeHTML, pageHead } from "./helpers.js";

const extensions = [
  ["Night Sky", "Theme", "A calm, dark color palette for late-night browsing."],
  ["Soft Morning", "Theme", "A bright, low-contrast workspace palette."],
  ["Focus Mode", "Utility", "A simple layout preset that hides extra shortcuts."],
];

export function renderMarketplace() {
  return `${pageHead("Discover", "Marketplace", "A small catalog of local configuration ideas.")}<div class="grid">${extensions.map(([name, type, description]) => `<article class="card"><span class="card-icon" aria-hidden="true">⬡</span><p class="eyebrow">${escapeHTML(type)}</p><h3>${escapeHTML(name)}</h3><p>${escapeHTML(description)}</p><p class="small muted">Preview only — no third-party code is installed.</p></article>`).join("")}</div>`;
}
