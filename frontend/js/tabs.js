export function bindTabs(container, selector = "[data-tab]") {
  const tabs = [...container.querySelectorAll(selector)];
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((candidate) => {
      const active = candidate === tab;
      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-selected", String(active));
    });
  }));
}
