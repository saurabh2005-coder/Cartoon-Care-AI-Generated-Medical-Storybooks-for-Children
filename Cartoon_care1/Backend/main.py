from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
import requests
import os
from PIL import Image
from io import BytesIO

app = FastAPI()

# Create image folder if not exists
if not os.path.exists("generated_images"):
    os.makedirs("generated_images")

# Serve static images
app.mount("/generated_images", StaticFiles(directory="generated_images"), name="generated_images")


class StoryRequest(BaseModel):
    child_name: str
    age: int
    condition: str


# ⚠️ IMPORTANT: Regenerate your HF token after this
HF_TOKEN = ""


# ---------------------------
# Function 1: Generate Story using Ollama
# ---------------------------
def generate_story_from_llama(prompt):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        }
    )

    return response.json().get("response", "")


# ---------------------------
# Function 2: Generate Image using HuggingFace
# ---------------------------
def generate_image_from_hf(prompt, image_name):

    api_url = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}"
    }

    response = requests.post(
        api_url,
        headers=headers,
        json={"inputs": prompt}
    )

    if response.status_code == 200:
        image = Image.open(BytesIO(response.content))
        image_path = f"generated_images/{image_name}.png"
        image.save(image_path)
        return image_path
    else:
        print("HF Status Code:", response.status_code)
        print("HF Error:", response.text)
        return None


# ---------------------------
# Main Endpoint
# ---------------------------
@app.post("/generate-storybook")
def generate_storybook(request: StoryRequest):

    # 1️⃣ Generate story
    story_prompt = f"""
    Write a 5-page children's cartoon story about a child named {request.child_name},
    age {request.age}, who has {request.condition}.
    Make it comforting, inspiring, and suitable for a 6-year-old.
    """

    story = generate_story_from_llama(story_prompt)

    # 2️⃣ Generate image prompt
    image_prompt_text = generate_story_from_llama(
        f"Generate a detailed Pixar-style cartoon illustration prompt for this story:\n{story}"
    )

    # 3️⃣ Generate image using HuggingFace
    image_path = generate_image_from_hf(
        image_prompt_text,
        request.child_name
    )

    return {
        "story": story,
        "image": image_path
    }

