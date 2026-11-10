import { api } from "./api.js";
import { escapeHTML, pageHead } from "./helpers.js";

export async function renderMarketplace() {
  try {
    const data = await api("/api/plugins");
    return `${pageHead("Discover", "Marketplace", "A small catalog of local configuration ideas.")}<div class="grid">${data.plugins.map((plugin) => `<article class="card"><span class="card-icon" aria-hidden="true">⬡</span><p class="eyebrow">${escapeHTML(plugin.type)}</p><h3>${escapeHTML(plugin.name)}</h3><p>${escapeHTML(plugin.description)}</p><p class="small muted">${plugin.enabled ? "Built-in listing" : "Preview only"} — no third-party code is installed.</p></article>`).join("")}</div>`;
  } catch (error) {
    return `${pageHead("Discover", "Marketplace")}<div class="notice">${escapeHTML(error.message)}</div>`;
  }
}
