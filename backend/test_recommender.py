from PIL import Image

from recommend import JewelleryRecommender


print("Starting recommender test...")

recommender = JewelleryRecommender()

print("\nTesting with Nck_1.jpg...")

image_path = "../data/images/Nck_1.jpg"

with Image.open(image_path) as image:
    image = image.convert("RGB")

    results = recommender.recommend(
        image,
        top_k=3
    )

print("\nRecommendations:")

for result in results:
    print(result)

print("\nTEST SUCCESSFUL")