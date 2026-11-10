const STORAGE_KEY = "travelx-favorite-games";

export function getFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((value) => typeof value === "string") : [];
  } catch (error) {
    return [];
  }
}

export function toggleFavorite(gameId) {
  const favorites = new Set(getFavorites());
  if (favorites.has(gameId)) favorites.delete(gameId);
  else favorites.add(gameId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  return favorites.has(gameId);
}
