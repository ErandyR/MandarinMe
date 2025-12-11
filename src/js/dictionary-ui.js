import { loadDictionary, search, addFavorite, getFavorites, removeFavorite, formatEntryForDisplay } from './searchDictionary.mjs';
import { getImage } from "./unsplashApi.mjs";

const DICT_URL = '../json/cedict.json'; // cedict JSON

// DOM
const input = document.getElementById('searchInput');
const btn = document.getElementById('searchBtn');
const resultBox = document.getElementById('result');
const resultHan = document.getElementById('resultHan');
const resultPinyin = document.getElementById('resultPinyin');
const resultDef = document.getElementById('resultDef');
const addFavBtn = document.getElementById('addFavoriteBtn');
const favListEl = document.getElementById('favoritesList');

let lastEntry = null;

async function init() {
    try {
        await loadDictionary(DICT_URL);
        renderFavorites();
    } catch (e) {
        console.error(e);
        alert("Error loading dictionary. Check console.");
    }
}

async function loadImageForWord(word) {
    const imgUrl = await getImage(word);

    const img = document.getElementById("dictionary-image");

    if (imgUrl) {
        img.src = imgUrl;
    } else {
        img.src = "fallback.jpg"; // fallback image
    }
}

btn.addEventListener('click', async () => {
    const q = input.value.trim();
    if (!q) return;

    const results = await search(q, { limit: 30 });
    if (!results || results.length === 0) {
        resultBox.classList.add('d-none');
        alert('No results found');
        return;
    }
    // take first result to show in the result widget
    const first = results[0];
    lastEntry = first.raw || first;
    const fmt = formatEntryForDisplay(first);
    resultHan.textContent = fmt.hanzi;
    resultPinyin.textContent = fmt.pinyin;
    resultDef.textContent = fmt.definitions;
    resultBox.classList.remove('d-none');
    // load image for the word
    await loadImageForWord(fmt.definitions.split(';')[0]);
});

// add favorite from displayed result
addFavBtn.addEventListener('click', () => {
    if (!lastEntry) return;
    addFavorite(lastEntry);
    renderFavorites();
});

// render favorites list
function renderFavorites() {
    const favs = getFavorites();
    favListEl.innerHTML = '';
    if (favs.length === 0) {
        favListEl.innerHTML = '<li class="list-group-item text-muted">No favorites yet</li>';
        return;
    }
    for (const f of favs) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-start';
        li.innerHTML = `
      <div>
        <div class="fw-bold">${f.simplified || f.traditional}</div>
        <small class="text-muted">${(f.pinyin || []).join(', ')}</small>
        <div class="small mt-1">${(f.definitions || []).join('; ')}</div>
      </div>
      <div>
        <button class="btn btn-sm btn-outline-danger remove-fav" data-key="${f.key}">Remove</button>
      </div>
    `;
        favListEl.appendChild(li);
    }

    // attach remove listeners
    favListEl.querySelectorAll('.remove-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const k = e.currentTarget.dataset.key;
            removeFavorite(k);
            renderFavorites();
        });
    });
}

init();
