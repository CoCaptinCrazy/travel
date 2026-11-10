export function startPolling(callback, interval = 4000) {
  const timer = window.setInterval(callback, interval);
  return () => window.clearInterval(timer);
}
