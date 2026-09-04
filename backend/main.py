import io
import os

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image

from recommend import JewelleryRecommender


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="JewelMatch AI API",
    description="AI-powered jewellery recommendation system.",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

IMAGE_DIR = os.path.join(
    BASE_DIR,
    "data",
    "images"
)


# ============================================================
# SERVE IMAGES
# ============================================================

app.mount(
    "/images",
    StaticFiles(directory=IMAGE_DIR),
    name="images"
)


# ============================================================
# INITIALIZE RECOMMENDER
# ============================================================

print()
print("=" * 60)
print("INITIALIZING JEWELMATCH AI")
print("=" * 60)

recommender = JewelleryRecommender()

print("=" * 60)
print("JEWELMATCH AI READY")
print("=" * 60)
print()


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "success": True,
        "message": "JewelMatch AI API is running",
        "version": "1.0.0"
    }


# ============================================================
# RECOMMEND FROM UPLOADED IMAGE
# ============================================================

@app.post("/recommend")
async def recommend_earrings(
    file: UploadFile = File(...)
):

    if not file.content_type:

        raise HTTPException(
            status_code=400,
            detail="File type could not be determined."
        )

    if not file.content_type.startswith("image/"):

        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image."
        )

    try:

        contents = await file.read()

        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

        recommendations = recommender.recommend(
            image,
            top_k=3
        )

        for item in recommendations:

            item["image_url"] = (
                "/images/"
                + item["image_file"]
            )

        return {
            "success": True,
            "recommendations": recommendations
        }

    except Exception as e:

        print(
            f"Recommendation error: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# RECOMMEND FROM INVENTORY NECKLACE
# ============================================================

@app.post("/recommend-by-filename")
async def recommend_by_filename(
    filename: str
):

    try:

        # ------------------------------------------------------
        # Security: only allow filenames, not paths
        # ------------------------------------------------------

        safe_filename = os.path.basename(
            filename
        )

        # Only allow necklace files
        if not safe_filename.lower().startswith("nck_"):

            raise HTTPException(
                status_code=400,
                detail="Only necklace images are allowed."
            )

        if not safe_filename.lower().endswith(
            (".jpg", ".jpeg", ".png", ".webp")
        ):

            raise HTTPException(
                status_code=400,
                detail="Invalid image format."
            )

        # ------------------------------------------------------
        # Build image path
        # ------------------------------------------------------

        image_path = os.path.join(
            IMAGE_DIR,
            safe_filename
        )

        # ------------------------------------------------------
        # Verify image exists
        # ------------------------------------------------------

        if not os.path.isfile(image_path):

            raise HTTPException(
                status_code=404,
                detail=f"Necklace image not found: {safe_filename}"
            )

        # ------------------------------------------------------
        # Load image
        # ------------------------------------------------------

        image = Image.open(
            image_path
        ).convert("RGB")

        # ------------------------------------------------------
        # Generate recommendations
        # ------------------------------------------------------

        recommendations = recommender.recommend(
            image,
            top_k=3
        )

        # ------------------------------------------------------
        # Add image URLs
        # ------------------------------------------------------

        for item in recommendations:

            item["image_url"] = (
                "/images/"
                + item["image_file"]
            )

        return {
            "success": True,
            "selected_necklace": safe_filename,
            "recommendations": recommendations
        }

    except HTTPException:

        raise

    except Exception as e:

        print(
            f"Recommendation error: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
  