import { loadCedict } from "./cedictParser.mjs";
import { initFlashcards } from "./flashcards.mjs";

document.addEventListener("DOMContentLoaded", async () => {
    const allEntries = await loadCedict("../data/cedict_ts.u8");

    // EJEMPLO: tomar solo las primeras 9000 palabras
    const selected = allEntries.slice(0, 9000).map(entry => ({
        front: entry.simplified,
        pinyin: entry.pinyin,
        back: entry.definitions
    }));

    initFlashcards({
        data: selected,
        card: document.getElementById("flashcard"),
        nextBtn: document.getElementById("nextCardBtn"),
        favBtn: document.getElementById("addToFavBtn")
    });
});