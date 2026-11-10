import { pageHead } from "./helpers.js";

export function renderDownloads() {
  return `${pageHead("Your files", "Downloads", "Downloads from websites are managed by your browser.")}<section class="card"><span class="card-icon" aria-hidden="true">↓</span><h2>Browser downloads</h2><p>When you download a file from a website, use your browser's built-in downloads panel to view or manage it. TravelX does not fetch files on your behalf.</p><div class="notice">Only download files from sources you trust. This starter does not provide file hosting or an upload service.</div></section>`;
}
