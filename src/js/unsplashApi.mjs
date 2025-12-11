const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_KEY;

export async function getImage(query) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${UNSPLASH_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) return null;

    return data.results[0].urls.small;
}
