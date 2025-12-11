// Módulo para buscar en CC-CEDICT JSON en el navegador.
// Exporta loadDictionary, search, favorites helpers.

// ------ Config / estado interno ------
let DICT = null;         // array de entradas
let DICT_MAP = null;     // optional map for exact hanzi lookup
const FAVORITES_KEY = "mandarinme.favorites.v1";

// ------ Helpers ------
function normalizeString(str) {
  if (!str) return "";
  return str.normalize("NFC").toLowerCase().trim();
}

// elimina dígitos de pinyin "ni3 hao3" -> "ni hao"
function stripPinyinNumbers(pinyin) {
  if (!pinyin) return "";
  return pinyin.replace(/[0-9]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

// detecta si la query contiene caracteres chinos (CJK)
function isChineseInput(q) {
  return /[\u4e00-\u9fff]/.test(q);
}

// simple ranker: exact match > startsWith > includes
function rankMatch(target, q) {
  if (!target) return 0;
  const t = normalizeString(target);
  const qq = normalizeString(q);
  if (t === qq) return 100;
  if (t.startsWith(qq)) return 75;
  if (t.includes(qq)) return 50;
  return 0;
}

// key for favorites (use simplified + first pinyin as key)
function entryKey(entry) {
  const s = entry.simplified || entry.traditional || "";
  const p = Array.isArray(entry.pinyin) ? entry.pinyin[0] : entry.pinyin || "";
  return `${s}__${stripPinyinNumbers(p)}`;
}

// ------ Public API ------

/**
 * Carga el diccionario JSON desde una URL pública (o ruta local)
 * @param {string} url - ruta a cedict.json
 */
export async function loadDictionary(url) {
  if (DICT) return DICT;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load dictionary: " + res.status);
  const data = await res.json();
  // data expected: array of objects like {simplified, traditional, pinyin, definitions}
  DICT = Array.isArray(data) ? data : Object.values(data);
  // build a quick map for exact hanzi lookup (simplified first)
  DICT_MAP = new Map();
  for (const e of DICT) {
    const keyS = e.simplified || "";
    if (keyS) {
      if (!DICT_MAP.has(keyS)) DICT_MAP.set(keyS, []);
      DICT_MAP.get(keyS).push(e);
    }
    const keyT = e.traditional || "";
    if (keyT && !DICT_MAP.has(keyT)) DICT_MAP.set(keyT, []);
    if (keyT) DICT_MAP.get(keyT).push(e);
  }
  return DICT;
}

/**
 * Busca en el diccionario.
 * @param {string} query - texto introducido por el usuario
 * @param {object} options - {limit: number}
 */
export async function search(query, options = { limit: 20 }) {
  if (!DICT) throw new Error("Dictionary not loaded. Call loadDictionary(url) first.");
  const q = String(query || "").trim();
  if (!q) return [];

  const results = [];
  const limit = options.limit || 20;
  const qNormalized = normalizeString(q);

  // 1) si es chino, mirar map para coincidencias exactas y return rápido
  if (isChineseInput(q)) {
    const exact = DICT_MAP && (DICT_MAP.get(q) || []);
    if (exact && exact.length) {
      // rank exact matches highly
      return exact.map(e => ({ entry: e, score: 100 }));
    }
    // fallback: search by includes on hanzi
    for (const e of DICT) {
      if ((e.simplified && e.simplified.includes(q)) || (e.traditional && e.traditional.includes(q))) {
        results.push({ entry: e, score: 60 });
      }
    }
  } else {
    // not chinese: could be pinyin (contains numbers or letters with tone marks) or english
    const qIsPinyin = /[0-9]/.test(q) || /[āēīōūǖǎěǐǒǔǘǚǜ]/i.test(q); // numbers or diacritics
    const qPinyinStripped = stripPinyinNumbers(q);

    for (const e of DICT) {
      let score = 0;

      //  a) pinyin match
      const pArr = Array.isArray(e.pinyin) ? e.pinyin : [e.pinyin || ""];
      for (const p of pArr) {
        if (!p) continue;
        const pStripped = stripPinyinNumbers(p);
        score = Math.max(score, rankMatch(pStripped, qPinyinStripped));
        // exact with numbers maybe stronger
        if (qIsPinyin) score = Math.max(score, rankMatch(normalizeString(p), qNormalized) + 5);
      }

      // b) English definitions match
      const defs = Array.isArray(e.definitions) ? e.definitions.join("; ") : (e.definitions || "");
      if (defs) {
        // simple substring match in english
        if (normalizeString(defs).includes(qNormalized)) {
          score = Math.max(score, 40 + rankMatch(defs, q));
        }
      }

      // c) hanzi fields also considered for substring matches (useful when user types romanization without tones)
      if (e.simplified && normalizeString(e.simplified).includes(qNormalized)) {
        score = Math.max(score, 60);
      }
      if (score > 0) results.push({ entry: e, score });
    }
  }

  // deduplicate by key and sort by score desc
  const unique = new Map();
  for (const r of results) {
    const k = (r.entry.simplified || r.entry.traditional || "") + "|" + (Array.isArray(r.entry.pinyin) ? r.entry.pinyin[0] : r.entry.pinyin || "");
    if (!unique.has(k) || unique.get(k).score < r.score) unique.set(k, r);
  }
  const arr = Array.from(unique.values()).sort((a, b) => b.score - a.score).slice(0, limit);

  // format to return entry + convenience fields
  return arr.map(r => ({
    simplified: r.entry.simplified,
    traditional: r.entry.traditional,
    pinyin: Array.isArray(r.entry.pinyin) ? r.entry.pinyin : [r.entry.pinyin || ""],
    definitions: Array.isArray(r.entry.definitions) ? r.entry.definitions : (r.entry.definitions ? [r.entry.definitions] : []),
    raw: r.entry,
    score: r.score
  }));
}

// favorites: store minimal payload in localStorage
export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load favorites", e);
    return [];
  }
}

export function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

export function addFavorite(entry) {
  const fav = getFavorites();
  const key = entryKey(entry);
  if (fav.find(x => x.key === key)) return fav; // already there
  const item = {
    key,
    simplified: entry.simplified,
    traditional: entry.traditional,
    pinyin: Array.isArray(entry.pinyin) ? entry.pinyin : [entry.pinyin || ""],
    definitions: Array.isArray(entry.definitions) ? entry.definitions : [entry.definitions || ""]
  };
  fav.unshift(item);
  saveFavorites(fav);
  return fav;
}

export function removeFavorite(key) {
  let fav = getFavorites();
  fav = fav.filter(f => f.key !== key);
  saveFavorites(fav);
  return fav;
}

export function clearFavorites() {
  saveFavorites([]);
}


export function formatEntryForDisplay(entryObj) {
  // entryObj is one of the objects returned by search()
  return {
    hanzi: entryObj.simplified || entryObj.traditional || "",
    pinyin: entryObj.pinyin ? entryObj.pinyin.join(" / ") : "",
    definitions: Array.isArray(entryObj.definitions) ? entryObj.definitions.join("; ") : (entryObj.definitions || "")
  };
}
