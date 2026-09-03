import os
import numpy as np
import pandas as pd
import torch

from PIL import Image
from transformers import CLIPModel, CLIPProcessor


class JewelleryRecommender:

    def __init__(self):

        # ---------------------------------------------------------
        # Project paths
        # ---------------------------------------------------------

        BASE_DIR = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )

        self.csv_path = os.path.join(
            BASE_DIR,
            "data",
            "candidate_dataset.csv"
        )

        self.image_dir = os.path.join(
            BASE_DIR,
            "data",
            "images"
        )

        # ---------------------------------------------------------
        # Load dataset
        # ---------------------------------------------------------

        print("Loading dataset...")

        self.df = pd.read_csv(self.csv_path)

        # Keep only earrings for recommendations
        self.earrings_df = self.df[
            self.df["product_type"].str.lower() == "earrings"
        ].copy()

        necklace_count = len(self.df) - len(self.earrings_df)

        print(
            f"Found {len(self.earrings_df)} earrings "
            f"and {necklace_count} necklaces."
        )

        # ---------------------------------------------------------
        # Select device
        # ---------------------------------------------------------

        self.device = (
            "cuda"
            if torch.cuda.is_available()
            else "cpu"
        )

        print(f"Using device: {self.device}")

        # ---------------------------------------------------------
        # Load CLIP
        # ---------------------------------------------------------

        print("Loading CLIP model...")

        self.processor = CLIPProcessor.from_pretrained(
            "openai/clip-vit-base-patch32"
        )

        self.model = CLIPModel.from_pretrained(
            "openai/clip-vit-base-patch32"
        ).to(self.device)

        self.model.eval()

        print("CLIP model loaded.")

        # ---------------------------------------------------------
        # Pre-compute embeddings for all earrings
        # ---------------------------------------------------------

        self.earring_embeddings = []

        print("Creating earring embeddings...")

        for _, row in self.earrings_df.iterrows():

            image_path = os.path.join(
                self.image_dir,
                str(row["image_file"])
            )

            print(
                f"Processing {row['image_file']}..."
            )

            image = Image.open(
                image_path
            ).convert("RGB")

            embedding = self.get_embedding(image)

            self.earring_embeddings.append(
                embedding
            )

        # Convert list to NumPy matrix
        self.earring_embeddings = np.vstack(
            self.earring_embeddings
        )

        print(
            "Earring embeddings created successfully."
        )

    # =============================================================
    # Generate CLIP image embedding
    # =============================================================

    def get_embedding(self, image):

        # Prepare image for CLIP
        inputs = self.processor(
            images=image,
            return_tensors="pt"
        )

        # Move tensors to CPU/GPU
        inputs = {
            key: value.to(self.device)
            for key, value in inputs.items()
        }

        # Generate image features
        with torch.no_grad():

            image_features = self.model.get_image_features(
                **inputs
            )

        # ---------------------------------------------------------
        # Transformers compatibility
        # ---------------------------------------------------------

        # Some Transformers versions return an object
        # containing pooler_output.
        if hasattr(
            image_features,
            "pooler_output"
        ):

            image_features = (
                image_features.pooler_output
            )

        # Some versions may return a tuple.
        elif isinstance(
            image_features,
            tuple
        ):

            image_features = image_features[0]

        # ---------------------------------------------------------
        # Convert tensor to NumPy
        # ---------------------------------------------------------

        embedding = (
            image_features
            .cpu()
            .numpy()[0]
        )

        # ---------------------------------------------------------
        # Normalize embedding
        # ---------------------------------------------------------

        embedding = embedding / (
            np.linalg.norm(embedding) + 1e-10
        )

        return embedding

    # =============================================================
    # Recommend matching earrings
    # =============================================================

    def recommend(
        self,
        necklace_image,
        top_k=3
    ):

        print(
            "Generating necklace embedding..."
        )

        necklace_embedding = self.get_embedding(
            necklace_image
        )

        # ---------------------------------------------------------
        # Calculate cosine similarity
        # ---------------------------------------------------------

        # Both necklace and earring embeddings
        # are normalized, so dot product gives
        # cosine similarity.

        similarities = np.dot(
            self.earring_embeddings,
            necklace_embedding
        )

        # ---------------------------------------------------------
        # Get highest scoring earrings
        # ---------------------------------------------------------

        top_indices = np.argsort(
            similarities
        )[::-1][:top_k]

        recommendations = []

        # ---------------------------------------------------------
        # Build response
        # ---------------------------------------------------------

        for index in top_indices:

            row = self.earrings_df.iloc[index]

            recommendations.append(
                {
                    "id": str(row["id"]),
                    "product_type": str(
                        row["product_type"]
                    ),
                    "image_file": str(
                        row["image_file"]
                    ),
                    "similarity": float(
                        similarities[index]
                    )
                }
            )

        return recommendations