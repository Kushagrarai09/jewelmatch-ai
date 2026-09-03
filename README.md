# 💎 JewelMatch AI

### AI-Powered Jewellery Recommendation Prototype

JewelMatch AI is a visual jewellery recommendation prototype developed for the Bharath Jewellos assignment.

The application allows a user to select a necklace from the provided jewellery inventory and recommends the top matching earrings based on visual similarity.

---

## 🎯 Objective

Given a necklace image from the provided inventory:

1. Allow the user to select a necklace.
2. Analyze the necklace visually.
3. Compare it against the available earrings.
4. Rank earrings based on visual similarity.
5. Return the top 3 matching earrings from the provided inventory.

---

## 🧠 Approach

The prototype uses a **pretrained CLIP image model** to generate visual embeddings for the jewellery images.

No AI model was trained from scratch.

### Recommendation Pipeline

```text
                Necklace Image
                      │
                      ▼
             Pretrained CLIP
                      │
                      ▼
              Image Embedding
                      │
                      ▼
       ┌─────────────────────────┐
       │ Compare with 15 Earring │
       │       Embeddings        │
       └────────────┬────────────┘
                    │
                    ▼
           Cosine Similarity
                    │
                    ▼
             Rank Earrings
                    │
                    ▼
              Top 3 Matches


## ⚡ Quick Start

```powershell
# 1. Clone
git clone https://github.com/YOUR_USERNAME/jewelmatch-ai.git
cd jewelmatch-ai

# 2. Create environment
python -m venv venv
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start backend
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000          

 # 5. Start frontend 
 cd jewellery-recommender/frontend
python -m http.server 5500
