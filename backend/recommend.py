import gc
import os

import numpy as np
import pandas as pd
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor


MODEL_NAME = "openai/clip-vit-base-patch32"


class JewelleryRecommender:

    def __init__(self):

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

        print("Loading dataset...")

        df = pd.read_csv(self.csv_path)

        self.earrings_df = df[
            df["product_type"].str.lower() == "earrings"
        ].copy()

        necklace_count = len(df) - len(self.earrings_df)

        print(
            f"Found {len(self.earrings_df)} earrings "
            f"and {necklace_count} necklaces."
        )

        # Free dataframe memory
        del df
        gc.collect()

        # Railway runs on CPU
        self.device = torch.device("cpu")

        # Reduce CPU memory usage
        torch.set_num_threads(1)

        print(f"Using device: {self.device}")

        print("Loading CLIP model...")

        self.processor = CLIPProcessor.from_pretrained(
            MODEL_NAME
        )

        self.model = CLIPModel.from_pretrained(
            MODEL_NAME
        )

        self.model.to(self.device)
        self.model.eval()

        # No training is required
        for parameter in self.model.parameters():
            parameter.requires_grad_(False)

        print("CLIP model loaded.")

        self._create_earring_embeddings()

    def _create_earring_embeddings(self):

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

            with Image.open(image_path) as image:

                image = image.convert("RGB")

                embedding = self.get_embedding(image)

                self.earring_embeddings.append(
                    embedding
                )

            # Release temporary image/tensor memory
            gc.collect()

        self.earring_embeddings = np.asarray(
            self.earring_embeddings,
            dtype=np.float32
        )

        print(
            "Earring embeddings created successfully."
        )

    def get_embedding(self, image):

        inputs = self.processor(
            images=image,
            return_tensors="pt"
        )

        # Only move required tensor to CPU explicitly
        inputs = {
            key: value.to(self.device)
            for key, value in inputs.items()
        }

        with torch.inference_mode():

            image_features = self.model.get_image_features(
                **inputs
            )

        # Compatibility with different Transformers versions
        if hasattr(image_features, "pooler_output"):

            image_features = (
                image_features.pooler_output
            )

        elif isinstance(image_features, tuple):

            image_features = image_features[0]

        # Normalize embedding
        image_features = torch.nn.functional.normalize(
            image_features,
            p=2,
            dim=-1
        )

        embedding = (
            image_features
            .cpu()
            .numpy()[0]
            .astype(np.float32, copy=True)
        )

        # Release temporary tensors
        del inputs
        del image_features

        gc.collect()

        return embedding

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

        similarities = np.dot(
            self.earring_embeddings,
            necklace_embedding
        )

        top_k = min(
            top_k,
            len(self.earring_embeddings)
        )

        top_indices = np.argsort(
            similarities
        )[::-1][:top_k]

        recommendations = []

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

        del necklace_embedding
        del similarities
        del top_indices

        gc.collect()

        return recommendations