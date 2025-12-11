import { generatePhrases, playTTS } from "./phraseGeneratorApi.mjs";

const topicInput = document.querySelector("#topicInput");
const generateBtn = document.querySelector("#generateBtn");
const resultsDiv = document.querySelector("#results");

generateBtn.addEventListener("click", async () => {
    const topic = topicInput.value.trim();
    if (!topic) return;

    resultsDiv.innerHTML = `<p class="text-muted">Generating...</p>`;

    const phrases = await generatePhrases(topic); // from OpenAI
    renderPhrases(phrases);
});

function renderPhrases(list) {
    resultsDiv.innerHTML = "";

    list.forEach((p, index) => {
        const card = document.createElement("div");
        card.className = "card mb-3 shadow-sm";

        card.innerHTML = `
            <div class="card-body">
                <h4>${p.hanzi}</h4>
                <p class="text-danger">${p.pinyin}</p>
                <p class="text-muted">${p.translation}</p>

                <button class="btn btn-sm btn-outline-primary" data-audio="${index}">
                    🔊 Listen
                </button>
            </div>
        `;

        resultsDiv.appendChild(card);

        // add audio playback
        const btn = card.querySelector("button");
        btn.addEventListener("click", () => playTTS(p.hanzi));
    });
}
