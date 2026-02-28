from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
import requests
import os
from PIL import Image
import torch
from diffusers import StableDiffusionPipeline

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


# --------------------------------
# Stable Diffusion Setup (GPU Enabled)
# --------------------------------

pipe = None
device = "cuda" if torch.cuda.is_available() else "cpu"


def load_model():
    global pipe

    if pipe is None:
        print(f"Loading Stable Diffusion on {device}...")

        if device == "cuda":
            pipe = StableDiffusionPipeline.from_pretrained(
                "runwayml/stable-diffusion-v1-5",
                torch_dtype=torch.float16
            )
            pipe = pipe.to(device)
            pipe.enable_attention_slicing()
        else:
            pipe = StableDiffusionPipeline.from_pretrained(
                "runwayml/stable-diffusion-v1-5"
            )
            pipe = pipe.to(device)

        print("Model loaded successfully!")


# --------------------------------
# Function 1: Generate Story (Ollama)
# --------------------------------
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


# --------------------------------
# Function 2: Generate Image (GPU Optimized)
# --------------------------------
def generate_image_from_local_sd(prompt, image_name):

    load_model()

    # Generate image (512x512 default, good for RTX 4050)
    image = pipe(
        prompt,
        height=512,
        width=512,
        num_inference_steps=25,
        guidance_scale=7.5
    ).images[0]

    image_path = f"generated_images/{image_name}.png"
    image.save(image_path)

    return image_path


# --------------------------------
# Main Endpoint
# --------------------------------
@app.post("/generate-storybook")
def generate_storybook(request: StoryRequest):

    # 1️⃣ Generate Story
    story_prompt = f"""
    Write a 5-page children's cartoon story about a child named {request.child_name},
    age {request.age}, who has {request.condition}.
    Make it comforting and inspiring.
    """

    story = generate_story_from_llama(story_prompt)

    # 2️⃣ Create Image Prompts
    image_prompts = [
        f"Pixar style children's book illustration of a {request.age}-year-old child named {request.child_name}, soft pastel colors, storybook art",
        f"Children's storybook illustration of {request.child_name} playing outside in a sunny park, watercolor style",
        f"Cartoon illustration of {request.child_name} smiling with friends, warm lighting",
        f"Whimsical children's book illustration of magical garden, butterflies, pastel colors",
        f"Happy children's book illustration of confident child standing proudly, soft lighting"
    ]

    image_paths = []

    # 3️⃣ Generate Images
    for i, prompt in enumerate(image_prompts):
        image_path = generate_image_from_local_sd(prompt, f"page_{i+1}")
        image_paths.append(image_path)

    return {
        "story": story,
        "images": image_paths
    }