// ============================================================
// JEWELMATCH AI - FRONTEND
// ============================================================

// Railway backend
const API_URL = "https://jewelmatch-ai-production.up.railway.app";


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

// Upload elements
let testImageInput;
let uploadedPreview;
let uploadPlaceholder;


// ============================================================
// APPLICATION STATE
// ============================================================

let selectedNecklaceFile = null;

let uploadedTestFile = null;
let uploadedPreviewUrl = null;


// ============================================================
// INITIALIZE APPLICATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // Inventory elements
    necklaceGrid = document.getElementById("necklaceGrid");
    selectedPanel = document.getElementById("selectedPanel");
    selectedNecklace = document.getElementById("selectedNecklace");
    selectedName = document.getElementById("selectedName");

    // Recommendation elements
    recommendButton = document.getElementById("recommendButton");
    loading = document.getElementById("loading");
    resultsSection = document.getElementById("resultsSection");

    // Support either ID if your HTML uses one of them
    recommendationsContainer =
        document.getElementById("recommendations") ||
        document.getElementById("recommendationsContainer");

    errorMessage = document.getElementById("errorMessage");

    // Upload elements
    testImageInput = document.getElementById("testImageInput");
    uploadedPreview = document.getElementById("uploadedPreview");
    uploadPlaceholder = document.getElementById("uploadPlaceholder");


    // --------------------------------------------------------
    // Check required elements
    // --------------------------------------------------------

    if (!necklaceGrid) {
        console.error("Missing #necklaceGrid");
    }

    if (!recommendButton) {
        console.error("Missing #recommendButton");
    }

    if (!resultsSection) {
        console.error("Missing #resultsSection");
    }

    if (!recommendationsContainer) {
        console.error(
            "Missing #recommendations or #recommendationsContainer"
        );
    }


    // --------------------------------------------------------
    // Recommendation button
    // --------------------------------------------------------

    if (recommendButton) {
        recommendButton.addEventListener(
            "click",
            recommendEarrings
        );
    }


    // --------------------------------------------------------
    // Upload test image
    // --------------------------------------------------------

    if (testImageInput) {
        testImageInput.addEventListener(
            "change",
            handleTestImageUpload
        );
    }


    // --------------------------------------------------------
    // Load inventory
    // --------------------------------------------------------

    loadNecklaces();

});


// ============================================================
// LOAD NECKLACE INVENTORY
// ============================================================

async function loadNecklaces() {

    if (!necklaceGrid) {
        return;
    }

    // Clear existing cards
    necklaceGrid.innerHTML = "";


    // The assignment contains 5 necklaces
    const necklaces = [
        "Nck_1.jpg",
        "Nck_2.jpg",
        "Nck_3.jpg",
        "Nck_4.jpg",
        "Nck_5.jpg"
    ];


    necklaces.forEach((filename, index) => {

        const card = document.createElement("div");

        card.className = "necklace-card";

        card.dataset.filename = filename;


        card.innerHTML = `
            <div class="necklace-image-wrapper">

                <img
                    src="${API_URL}/images/${filename}"
                    alt="Necklace ${index + 1}"
                    class="necklace-image"
                >

            </div>

            <div class="necklace-card-info">

                <h3>Necklace ${index + 1}</h3>

                <p>Inventory Item</p>

            </div>
        `;


        // Click handler
        card.addEventListener("click", () => {

            selectNecklace(
                filename,
                card,
                index + 1
            );

        });

// Image error handling with one retry
const image = card.querySelector("img");

if (image) {

    let retryCount = 0;

    image.addEventListener("error", () => {

        console.error(
            "Could not load necklace image:",
            filename
        );

        if (retryCount < 1) {

            retryCount++;

            console.log(
                "Retrying necklace image:",
                filename
            );

            setTimeout(() => {

                image.src =
                    `${API_URL}/images/${filename}?retry=${Date.now()}`;

            }, 1000);

        } else {

            image.alt =
                `Unable to load ${filename}`;

        }

    });

}


        necklaceGrid.appendChild(card);

    });


    console.log(
        "Necklace inventory loaded:",
        necklaces
    );
}


// ============================================================
// SELECT INVENTORY NECKLACE
// ============================================================

function selectNecklace(filename, card, number) {

    console.log(
        "Selected inventory necklace:",
        filename
    );


    // --------------------------------------------------------
    // Set selected inventory item
    // --------------------------------------------------------

    selectedNecklaceFile = filename;


    // --------------------------------------------------------
    // Clear uploaded-image mode
    // --------------------------------------------------------

    uploadedTestFile = null;


    if (testImageInput) {
        testImageInput.value = "";
    }


    // Remove previous object URL
    if (uploadedPreviewUrl) {

        URL.revokeObjectURL(
            uploadedPreviewUrl
        );

        uploadedPreviewUrl = null;

    }


    // Clear upload preview
    if (uploadedPreview) {

        uploadedPreview.removeAttribute("src");

        uploadedPreview.style.display = "none";

    }


    if (uploadPlaceholder) {

        uploadPlaceholder.style.display =
            "block";

    }


    // --------------------------------------------------------
    // Remove previous selected states
    // --------------------------------------------------------

    document
        .querySelectorAll(".necklace-card")
        .forEach(item => {

            item.classList.remove("selected");

            const badge =
                item.querySelector(
                    ".selected-badge"
                );

            if (badge) {
                badge.remove();
            }

        });


    // Mark current card selected
    card.classList.add("selected");


    // Add selected badge
    const badge =
        document.createElement("div");

    badge.className = "selected-badge";

    badge.textContent = "✓ Selected";

    card.appendChild(badge);


    // --------------------------------------------------------
    // Show selected necklace panel
    // --------------------------------------------------------

    if (selectedPanel) {

        selectedPanel.classList.remove(
            "hidden"
        );

    }


    if (selectedNecklace) {

        selectedNecklace.src =
            `${API_URL}/images/${filename}`;

        selectedNecklace.alt =
            `Selected Necklace ${number}`;

    }


    if (selectedName) {

        selectedName.textContent =
            `Necklace ${number}`;

    }


    // --------------------------------------------------------
    // Clear old recommendations
    // --------------------------------------------------------

    clearResults();

    hideError();

}


// ============================================================
// HANDLE UPLOADED TEST IMAGE
// ============================================================

function handleTestImageUpload(event) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    // --------------------------------------------------------
    // Validate image
    // --------------------------------------------------------

    if (!file.type.startsWith("image/")) {

        showError(
            "Please upload a valid image file."
        );

        event.target.value = "";

        return;
    }


    // --------------------------------------------------------
    // Maximum file size: 10 MB
    // --------------------------------------------------------

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        showError(
            "Please upload an image smaller than 10 MB."
        );

        event.target.value = "";

        return;
    }


    hideError();


    // --------------------------------------------------------
    // Store uploaded file
    // --------------------------------------------------------

    uploadedTestFile = file;


    // --------------------------------------------------------
    // Clear inventory selection
    // --------------------------------------------------------

    selectedNecklaceFile = null;


    document
        .querySelectorAll(".necklace-card")
        .forEach(card => {

            card.classList.remove(
                "selected"
            );

            const badge =
                card.querySelector(
                    ".selected-badge"
                );

            if (badge) {
                badge.remove();
            }

        });


    // Hide inventory selected panel
    if (selectedPanel) {

        selectedPanel.classList.add(
            "hidden"
        );

    }


    // --------------------------------------------------------
    // Create image preview
    // --------------------------------------------------------

    if (uploadedPreviewUrl) {

        URL.revokeObjectURL(
            uploadedPreviewUrl
        );

    }


    uploadedPreviewUrl =
        URL.createObjectURL(file);


    if (uploadedPreview) {

        uploadedPreview.src =
            uploadedPreviewUrl;

        uploadedPreview.style.display =
            "block";

    }


    if (uploadPlaceholder) {

        uploadPlaceholder.style.display =
            "none";

    }


    // --------------------------------------------------------
    // Clear previous results
    // --------------------------------------------------------

    clearResults();


    console.log(
        "Test image uploaded:",
        file.name
    );

}


// ============================================================
// RECOMMEND EARRINGS
// ============================================================

async function recommendEarrings() {

    hideError();


    // --------------------------------------------------------
    // Upload mode
    // --------------------------------------------------------

    if (uploadedTestFile) {

        await recommendFromUpload();

        return;
    }


    // --------------------------------------------------------
    // Inventory mode
    // --------------------------------------------------------

    if (selectedNecklaceFile) {

        await recommendFromInventory();

        return;
    }


    // --------------------------------------------------------
    // Nothing selected
    // --------------------------------------------------------

    showError(
        "Please select a necklace or upload a test image."
    );

}


// ============================================================
// RECOMMEND FROM INVENTORY
// ============================================================

async function recommendFromInventory() {

    if (!selectedNecklaceFile) {

        showError(
            "Please select a necklace first."
        );

        return;
    }


    console.log(
        "Requesting inventory recommendation:",
        selectedNecklaceFile
    );


    setLoadingState(true);


    try {

        const url =
            `${API_URL}/recommend-by-filename?filename=${encodeURIComponent(
                selectedNecklaceFile
            )}`;


        console.log(
            "Inventory API request:",
            url
        );


        const response =
            await fetch(
                url,
                {
                    method: "POST"
                }
            );


        const data =
            await parseApiResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.error ||
                `Server error: ${response.status}`
            );

        }


        if (!data.success) {

            throw new Error(
                data.error ||
                "Recommendation failed."
            );

        }


        console.log(
            "Inventory recommendation response:",
            data
        );


        displayRecommendations(
            data.recommendations
        );


    } catch (error) {

        console.error(
            "Inventory recommendation error:",
            error
        );


        handleApiError(error);

    } finally {

        setLoadingState(false);

    }

}


// ============================================================
// RECOMMEND FROM UPLOADED IMAGE
// ============================================================

async function recommendFromUpload() {

    if (!uploadedTestFile) {

        showError(
            "Please upload a test image first."
        );

        return;
    }


    console.log(
        "Requesting recommendation for uploaded image:",
        uploadedTestFile.name
    );


    setLoadingState(true);


    try {

        // ----------------------------------------------------
        // FormData
        // ----------------------------------------------------

        const formData =
            new FormData();


        formData.append(
            "file",
            uploadedTestFile
        );


        const url =
            `${API_URL}/recommend`;


        console.log(
            "Upload API request:",
            url
        );


        // ----------------------------------------------------
        // Send image to FastAPI
        // ----------------------------------------------------

        const response =
            await fetch(
                url,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await parseApiResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.error ||
                `Server error: ${response.status}`
            );

        }


        if (!data.success) {

            throw new Error(
                data.error ||
                "Recommendation failed."
            );

        }


        console.log(
            "Upload recommendation response:",
            data
        );


        displayRecommendations(
            data.recommendations
        );


    } catch (error) {

        console.error(
            "Upload recommendation error:",
            error
        );


        handleApiError(error);

    } finally {

        setLoadingState(false);

    }

}


// ============================================================
// PARSE API RESPONSE
// ============================================================

async function parseApiResponse(response) {

    const contentType =
        response.headers.get(
            "content-type"
        );


    if (
        contentType &&
        contentType.includes(
            "application/json"
        )
    ) {

        return await response.json();

    }


    const text =
        await response.text();


    return {
        error:
            text ||
            "Unexpected server response."
    };

}


// ============================================================
// DISPLAY RECOMMENDATIONS
// ============================================================

function displayRecommendations(items) {

    if (!recommendationsContainer) {

        console.error(
            "Recommendation container not found."
        );

        return;
    }


    if (
        !items ||
        items.length === 0
    ) {

        showError(
            "No matching earrings were found."
        );

        return;
    }


    // Clear previous recommendations
    recommendationsContainer.innerHTML = "";


    // --------------------------------------------------------
    // Display each recommendation
    // --------------------------------------------------------

    items.forEach(
        (item, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
    "earring-card";


            // Similarity percentage
            let similarityText = "";


            if (
                typeof item.similarity ===
                "number"
            ) {

                similarityText =
                    `${(
                        item.similarity * 100
                    ).toFixed(1)}% match`;

            }


            // Image URL
            let imageUrl =
                item.image_url || "";


            // Backend normally returns:
            // /images/Ear_1.jpg
            //
            // Therefore add API_URL before it.

            if (
                imageUrl &&
                imageUrl.startsWith("/")
            ) {

                imageUrl =
                    `${API_URL}${imageUrl}`;

            }


            card.innerHTML = `

                      <div class="earring-image-wrapper">
                    <img
                        src="${imageUrl}"
                        alt="Matching Earring ${index + 1}"
                        class="recommendation-image"
                        loading="lazy"
                    >

                </div>

                <div class="earring-info">
                    <div class="recommendation-rank">
                        #${index + 1}
                    </div>

                    <h3>
                        ${formatEarringName(
                            item.image_file,
                            index
                        )}
                    </h3>

                    <p class="match-score">
                        ${similarityText}
                    </p>

                </div>
            `;


            // Image error handling
            const image =
                card.querySelector("img");


            if (image) {

                image.addEventListener(
                    "error",
                    () => {

                        console.error(
                            "Could not load recommendation image:",
                            imageUrl
                        );

                    }
                );

            }


            recommendationsContainer.appendChild(
                card
            );

        }
    );


    // --------------------------------------------------------
    // Show results section
    // --------------------------------------------------------

    if (resultsSection) {

        resultsSection.classList.remove(
            "hidden"
        );

    }


    // Scroll to results
    setTimeout(() => {

        if (resultsSection) {

            resultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }, 100);


    console.log(
        "Displayed recommendations:",
        items
    );

}


// ============================================================
// FORMAT EARRING NAME
// ============================================================

function formatEarringName(
    filename,
    index
) {

    if (!filename) {

        return `Matching Earring ${index + 1}`;

    }


    // Ear_1.jpg -> Earring 1

    const match =
        filename.match(
            /Ear_(\d+)/i
        );


    if (match) {

        return `Earring ${match[1]}`;

    }


    return `Matching Earring ${index + 1}`;

}


// ============================================================
// LOADING STATE
// ============================================================

function setLoadingState(isLoading) {

    if (isLoading) {

        if (loading) {

            loading.classList.remove(
                "hidden"
            );

        }


        if (resultsSection) {

            resultsSection.classList.add(
                "hidden"
            );

        }


        if (recommendButton) {

            recommendButton.disabled =
                true;


            recommendButton.innerHTML = `
                <span>✦</span>
                Finding Matches...
            `;

        }

    } else {

        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }


        if (recommendButton) {

            recommendButton.disabled =
                false;


            recommendButton.innerHTML = `
                <span>✦</span>
                Find Matching Earrings
            `;

        }

    }

}


// ============================================================
// CLEAR RESULTS
// ============================================================

function clearResults() {

    if (resultsSection) {

        resultsSection.classList.add(
            "hidden"
        );

    }


    if (recommendationsContainer) {

        recommendationsContainer.innerHTML =
            "";

    }

}


// ============================================================
// SHOW ERROR
// ============================================================

function showError(message) {

    if (!errorMessage) {

        console.error(
            "Error:",
            message
        );

        return;
    }


    errorMessage.textContent =
        message;


    errorMessage.classList.remove(
        "hidden"
    );


    // Scroll error into view if necessary
    errorMessage.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


// ============================================================
// HIDE ERROR
// ============================================================

function hideError() {

    if (!errorMessage) {
        return;
    }


    errorMessage.textContent = "";


    errorMessage.classList.add(
        "hidden"
    );

}


// ============================================================
// HANDLE API ERRORS
// ============================================================

function handleApiError(error) {

    if (
        error &&
        (
            error.message ===
                "Failed to fetch" ||
            error.name ===
                "TypeError"
        )
    ) {

        showError(
            "Could not connect to the AI server. Please try again."
        );

        return;
    }


    showError(
        error?.message ||
        "Something went wrong while getting recommendations."
    );

}


// ============================================================
// CLEANUP OBJECT URL
// ============================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (uploadedPreviewUrl) {

            URL.revokeObjectURL(
                uploadedPreviewUrl
            );

        }

    }
);