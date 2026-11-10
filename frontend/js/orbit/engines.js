export function destinationFor(value) {
  const query = value.trim();
  if (!query) throw new Error("Enter a search or web address.");
  if (/^[a-z][a-z\d+.-]*:/i.test(query) && !/^https?:\/\//i.test(query)) {
    throw new Error("Only HTTP and HTTPS websites are supported.");
  }
  const addressPattern = /^(localhost|(?:[\w-]+\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(?::\d{1,5})?(?:[/?#].*)?$/i;
  const address = /^https?:\/\//i.test(query)
    ? query
    : addressPattern.test(query)
      ? `https://${query}`
      : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  let destination;
  try {
    destination = new URL(address);
  } catch (error) {
    throw new Error("That address doesn't look valid. Try a search instead.");
  }
  if (!["http:", "https:"].includes(destination.protocol) || !destination.hostname) {
    throw new Error("Only valid HTTP and HTTPS websites are supported.");
  }
  return destination;
}
