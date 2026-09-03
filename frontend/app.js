const API_URL = "http://127.0.0.1:8000";


// ============================================================
// DOM ELEMENTS
// ============================================================

let necklaceGrid;
let selectedPanel;
let selectedNecklace;
let selectedName;
let recommendButton;
let loading;
let resultsSection;
let recommendationsContainer;
let errorMessage;


// ============================================================
// STATE
// ============================================================

let selectedNecklaceFile = null;


// ============================================================
// INITIALIZE DOM
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // Get DOM elements
    necklaceGrid =
        document.getElementById("necklaceGrid");

    selectedPanel =
        document.getElementById("selectedPanel");

    selectedNecklace =
        document.getElementById("selectedNecklace");

    selectedName =
        document.getElementById("selectedName");

    recommendButton =
        document.getElementById("recommendButton");

    loading =
        document.getElementById("loading");

    resultsSection =
        document.getElementById("resultsSection");

    recommendationsContainer =
        document.getElementById("recommendations");

    errorMessage =
        document.getElementById("errorMessage");


    // Check required elements
    if (!necklaceGrid) {
        console.error("necklaceGrid element not found.");
        return;
    }

    if (!selectedPanel) {
        console.error("selectedPanel element not found.");
        return;
    }

    if (!selectedNecklace) {
        console.error("selectedNecklace element not found.");
        return;
    }

    if (!selectedName) {
        console.error("selectedName element not found.");
        return;
    }

    if (!recommendButton) {
        console.error("recommendButton element not found.");
        return;
    }


    // Button event
    recommendButton.addEventListener(
        "click",
        recommendEarrings
    );


    // Load necklace inventory
    loadNecklaces();

});


// ============================================================
// SHOW ERROR
// ============================================================

function showError(message) {

    if (!errorMessage) {
        console.error(message);
        return;
    }

    errorMessage.textContent = message;

    errorMessage.classList.remove("hidden");
}


// ============================================================
// HIDE ERROR
// ============================================================

function hideError() {

    if (!errorMessage) {
        return;
    }

    errorMessage.classList.add("hidden");
}


// ============================================================
// LOAD NECKLACES
// ============================================================

function loadNecklaces() {

    console.log("Loading necklace inventory...");

    necklaceGrid.innerHTML = "";


    // Dataset contains 5 necklaces
    for (let i = 1; i <= 5; i++) {

        const filename = `Nck_${i}.jpg`;


        // ----------------------------------------------------
        // Create card
        // ----------------------------------------------------

        const card =
            document.createElement("div");

        card.className =
            "necklace-card";

        card.dataset.filename =
            filename;


        // ----------------------------------------------------
        // Card HTML
        // ----------------------------------------------------

        card.innerHTML = `

            <div class="necklace-image-wrapper">

                <img
                    src="${API_URL}/images/${filename}"
                    alt="Necklace ${i}"
                    class="necklace-image"
                    loading="lazy"
                >

                <div class="necklace-number">
                    0${i}
                </div>

            </div>


            <div class="necklace-card-info">

                <strong>
                    Necklace ${i}
                </strong>

                <span>
                    Jewellery Collection
                </span>

            </div>

        `;


        // ----------------------------------------------------
        // Image error handling
        // ----------------------------------------------------

        const image =
            card.querySelector("img");

        image.addEventListener("error", () => {

            console.error(
                `Could not load image: ${filename}`
            );

            image.alt =
                `Unable to load Necklace ${i}`;

        });


        // ----------------------------------------------------
        // Click event
        // ----------------------------------------------------

        card.addEventListener("click", () => {

            selectNecklace(
                filename,
                card,
                i
            );

        });


        // ----------------------------------------------------
        // Add card to grid
        // ----------------------------------------------------

        necklaceGrid.appendChild(card);

    }


    console.log(
        "5 necklaces loaded successfully."
    );
}


// ============================================================
// SELECT NECKLACE
// ============================================================

function selectNecklace(
    filename,
    card,
    number
) {

    console.log(
        "Selected necklace:",
        filename
    );


    hideError();


    // --------------------------------------------------------
    // Remove previous selection
    // --------------------------------------------------------

    document
        .querySelectorAll(".necklace-card")
        .forEach(item => {

            item.classList.remove(
                "selected"
            );


            const badge =
                item.querySelector(
                    ".selected-badge"
                );


            if (badge) {
                badge.remove();
            }

        });


    // --------------------------------------------------------
    // Select current card
    // --------------------------------------------------------

    card.classList.add(
        "selected"
    );


    // --------------------------------------------------------
    // Add selected badge
    // --------------------------------------------------------

    const badge =
        document.createElement("div");

    badge.className =
        "selected-badge";

    badge.textContent =
        "SELECTED";

    card.appendChild(badge);


    // --------------------------------------------------------
    // Store selected filename
    // --------------------------------------------------------

    selectedNecklaceFile =
        filename;


    // --------------------------------------------------------
    // Show selected necklace
    // --------------------------------------------------------

    selectedNecklace.src =
        `${API_URL}/images/${filename}`;

    selectedNecklace.alt =
        `Selected Necklace ${number}`;


    selectedName.textContent =
        `Necklace ${number}`;


    // --------------------------------------------------------
    // Show selected panel
    // --------------------------------------------------------

    selectedPanel.classList.remove(
        "hidden"
    );


    // --------------------------------------------------------
    // Hide previous recommendations
    // --------------------------------------------------------

    resultsSection.classList.add(
        "hidden"
    );


    // Clear previous recommendations
    recommendationsContainer.innerHTML =
        "";

}


// ============================================================
// RECOMMEND EARRINGS
// ============================================================

async function recommendEarrings() {

    // --------------------------------------------------------
    // Validate selection
    // --------------------------------------------------------

    if (!selectedNecklaceFile) {

        showError(
            "Please select a necklace first."
        );

        return;
    }


    console.log(
        "Requesting recommendations for:",
        selectedNecklaceFile
    );


    hideError();


    // --------------------------------------------------------
    // Show loading
    // --------------------------------------------------------

    loading.classList.remove(
        "hidden"
    );

    resultsSection.classList.add(
        "hidden"
    );


    recommendButton.disabled =
        true;


    recommendButton.innerHTML =
        `
            <span>✦</span>
            Finding Matches...
        `;


    try {

        // ----------------------------------------------------
        // Send filename to FastAPI
        // ----------------------------------------------------

        const url =
            `${API_URL}/recommend-by-filename?filename=${encodeURIComponent(selectedNecklaceFile)}`;


        console.log(
            "API request:",
            url
        );


        const response =
            await fetch(
                url,
                {
                    method: "POST"
                }
            );


        // ----------------------------------------------------
        // HTTP error
        // ----------------------------------------------------

        if (!response.ok) {

            let errorMessageText =
                `Server error: ${response.status}`;


            try {

                const errorData =
                    await response.json();


                if (errorData.detail) {

                    errorMessageText =
                        errorData.detail;

                }

            } catch (parseError) {

                console.error(
                    "Could not parse server error.",
                    parseError
                );

            }


            throw new Error(
                errorMessageText
            );

        }


        // ----------------------------------------------------
        // Parse JSON
        // ----------------------------------------------------

        const data =
            await response.json();


        console.log(
            "Recommendation response:",
            data
        );


        // ----------------------------------------------------
        // Validate response
        // ----------------------------------------------------

        if (!data.success) {

            throw new Error(
                data.error ||
                "Recommendation failed."
            );

        }


        // ----------------------------------------------------
        // Display recommendations
        // ----------------------------------------------------

        displayRecommendations(
            data.recommendations
        );


    } catch (error) {

        console.error(
            "Recommendation error:",
            error
        );


        if (
            error.message ===
            "Failed to fetch"
        ) {

            showError(
                "Could not connect to the AI server. Make sure FastAPI is running on port 8000."
            );

        } else {

            showError(
                error.message
            );

        }


    } finally {

        // ----------------------------------------------------
        // Hide loading
        // ----------------------------------------------------

        loading.classList.add(
            "hidden"
        );


        // ----------------------------------------------------
        // Re-enable button
        // ----------------------------------------------------

        recommendButton.disabled =
            false;


        recommendButton.innerHTML =
            `
                <span>✦</span>
                Find Matching Earrings
            `;

    }

}


// ============================================================
// DISPLAY RECOMMENDATIONS
// ============================================================

function displayRecommendations(
    recommendations
) {

    recommendationsContainer.innerHTML =
        "";


    // --------------------------------------------------------
    // Validate recommendations
    // --------------------------------------------------------

    if (
        !recommendations ||
        recommendations.length === 0
    ) {

        showError(
            "No matching earrings were found."
        );

        return;
    }


    console.log(
        `Displaying ${recommendations.length} recommendations.`
    );


    // --------------------------------------------------------
    // Create recommendation cards
    // --------------------------------------------------------

    recommendations.forEach(
        (item, index) => {

            const card =
                document.createElement("div");

            card.className =
                "earring-card";


            // ------------------------------------------------
            // Rank badge
            // ------------------------------------------------

            const rank =
                document.createElement("div");

            rank.className =
                "rank-badge";

            rank.textContent =
                `MATCH ${index + 1}`;


            // ------------------------------------------------
            // Image wrapper
            // ------------------------------------------------

            const imageWrapper =
                document.createElement("div");

            imageWrapper.className =
                "earring-image-wrapper";


            // ------------------------------------------------
            // Earring image
            // ------------------------------------------------

            const image =
                document.createElement("img");


            image.src =
                `${API_URL}${item.image_url}`;


            image.alt =
                `Matching Earring ${index + 1}`;


            image.loading =
                "lazy";


            image.addEventListener(
                "error",
                () => {

                    console.error(
                        "Could not load earring image:",
                        item.image_url
                    );

                }
            );


            imageWrapper.appendChild(
                image
            );


            // ------------------------------------------------
            // Information
            // ------------------------------------------------

            const info =
                document.createElement("div");

            info.className =
                "earring-info";


            // Title
            const title =
                document.createElement("h3");

            title.textContent =
                item.id ||
                `Earring ${index + 1}`;


            // Match score
            const score =
                document.createElement("div");

            score.className =
                "match-score";


            const scoreLabel =
                document.createElement("span");

            scoreLabel.textContent =
                "Visual Match";


            const scoreValue =
                document.createElement("span");

            scoreValue.className =
                "score-value";


            const similarity =
                Number(item.similarity);


            scoreValue.textContent =
                `${(
                    similarity * 100
                ).toFixed(1)}%`;


            score.appendChild(
                scoreLabel
            );

            score.appendChild(
                scoreValue
            );


            // Add information
            info.appendChild(
                title
            );

            info.appendChild(
                score
            );


            // ------------------------------------------------
            // Build card
            // ------------------------------------------------

            card.appendChild(
                rank
            );

            card.appendChild(
                imageWrapper
            );

            card.appendChild(
                info
            );


            // Add to page
            recommendationsContainer
                .appendChild(card);

        }
    );


    // --------------------------------------------------------
    // Show results section
    // --------------------------------------------------------

    resultsSection.classList.remove(
        "hidden"
    );


    // --------------------------------------------------------
    // Scroll to results
    // --------------------------------------------------------

    setTimeout(() => {

        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 100);

}