export function initFlashcards({ data, card, nextBtn, favBtn }) {
    // Estado interno
    let index = 0;
    let isFlipped = false;

    // Render inicial
    renderCard();

    // -------------------------
    //   EVENTOS
    // -------------------------
    card.addEventListener("click", () => {
        isFlipped = !isFlipped;
        updateFlipState();
    });

    nextBtn.addEventListener("click", () => {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * data.length);
        } while (newIndex === index);

        index = newIndex;
        isFlipped = false;
        renderCard();
    });


    favBtn.addEventListener("click", () => {
        saveToFavorites(data[index]);
    });

    // -------------------------
    //   FUNCIONES INTERNAS
    // -------------------------

    function renderCard() {
        const item = data[index];

        card.querySelector(".card-front").innerHTML = `
            <h2 class="text-center">${item.front}</h2>
        `;

        card.querySelector(".card-back").innerHTML = `
            <p class="text-center fw-bold">${item.pinyin}</p>
            <p class="text-center">${item.back}</p>
        `;

        updateFlipState();
    }

    function updateFlipState() {
        if (isFlipped) {
            card.classList.add("flipped");
        } else {
            card.classList.remove("flipped");
        }
    }

    function saveToFavorites(item) {
        const currentFavs = JSON.parse(localStorage.getItem("flashcardFavorites") || "[]");

        // Evitar duplicados
        if (!currentFavs.some(f => f.front === item.front)) {
            currentFavs.push(item);
            localStorage.setItem("flashcardFavorites", JSON.stringify(currentFavs));
            alert("Added to favorites!");
        } else {
            alert("Already in favorites.");
        }
    }
}
