from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import requests
import os
import urllib.request

from PIL import Image
import torch
from diffusers import StableDiffusionPipeline

import cv2
import numpy as np

# GAN imports
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer


app = FastAPI()

# --------------------------------
# CORS
# --------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------
# Image Folder
# --------------------------------
if not os.path.exists("generated_images"):
    os.makedirs("generated_images")

app.mount("/generated_images", StaticFiles(directory="generated_images"), name="generated_images")

# --------------------------------
# Request Schema
# --------------------------------
class StoryRequest(BaseModel):
    child_name: str
    age: int
    condition: str


# --------------------------------
# Global Models
# --------------------------------
pipe = None
upscaler = None
device = "cuda" if torch.cuda.is_available() else "cpu"


# --------------------------------
# Load Models
# --------------------------------
def load_models():
    global pipe, upscaler

    # -------- Stable Diffusion --------
    if pipe is None:
        print(f"Loading Stable Diffusion on {device}")

        dtype = torch.float16 if device == "cuda" else torch.float32

        pipe = StableDiffusionPipeline.from_pretrained(
            "stablediffusionapi/disney-pixar-cartoon",
            torch_dtype=dtype
        )

        pipe = pipe.to(device)

        if device == "cuda":
            pipe.enable_attention_slicing()

        print("Stable Diffusion Loaded")

    # -------- RealESRGAN --------
    if upscaler is None:

        print("Loading RealESRGAN...")

        model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth"
        model_path = "RealESRGAN_x4plus_anime_6B.pth"

        if not os.path.exists(model_path):
            print("Downloading GAN weights...")
            urllib.request.urlretrieve(model_url, model_path)

        model = RRDBNet(
            num_in_ch=3,
            num_out_ch=3,
            num_feat=64,
            num_block=6,
            num_grow_ch=32,
            scale=4
        )

        upscaler = RealESRGANer(
            scale=4,
            model_path=model_path,
            model=model,
            tile=0,
            tile_pad=10,
            pre_pad=0,
            half=(device == "cuda"),
            device=device
        )

        print("GAN Upscaler Ready")


# --------------------------------
# Story Generation (Ollama)
# --------------------------------
def generate_story_from_mistral(prompt):

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "mistral",
            "prompt": prompt,
            "stream": False
        }
    )

    return response.json()["response"]


# --------------------------------
# Image Generation
# --------------------------------
def generate_image(prompt, image_name):

    load_models()

    print(f"Generating image: {image_name}")

    generator = torch.Generator(device=device).manual_seed(42)

    negative_prompt = """
    blurry, distorted face, extra fingers, bad anatomy,
    low quality, watermark, text, cropped, worst quality
    """

    # Generate base image
    base_image = pipe(
        prompt,
        negative_prompt=negative_prompt,
        height=768,
        width=768,
        num_inference_steps=35,
        guidance_scale=8.5,
        generator=generator
    ).images[0]

    # Convert to OpenCV format
    img_cv = cv2.cvtColor(np.array(base_image), cv2.COLOR_RGB2BGR)

    print("Upscaling with GAN...")

    try:
        enhanced, _ = upscaler.enhance(img_cv, outscale=2)
        final_image = Image.fromarray(cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB))
    except RuntimeError as e:
        print("GAN failed, using base image", e)
        final_image = base_image

    image_path = f"generated_images/{image_name}.png"
    final_image.save(image_path)

    return image_path


# --------------------------------
# Main API
# --------------------------------
@app.post("/generate-storybook")
def generate_storybook(request: StoryRequest):

    story_prompt =story_prompt = f"""
Create a 5-page illustrated children's picture book for kids aged 4–11.

Hero:
A child named {request.child_name} who is {request.age} years old.

Problem:
The child has {request.condition}.

Turn the condition into a fantasy villain monster.

Example:
Asthma → Airway Dragon

The child receives a magical tool that represents treatment.

Example:
Inhaler → Magic Breathing Wand

Rules:
• Each page must contain only 1 short sentence.
• Maximum 10 words per page.
• Focus on fun adventure.
• Very simple language for children.
• Bright and magical story.

Structure:

Page 1 → Introduce hero child.
---
Page 2 → Villain monster appears.
---
Page 3 → Child struggles.
---
Page 4 → Child uses magical tool.
---
Page 5 → Child wins and feels brave.

Separate pages using:
---
"""

    story = generate_story_from_mistral(story_prompt)

    pages = [p.strip() for p in story.split("---") if p.strip()]

    # Consistent character description
    character_description = f"""
A cute {request.age}-year-old child named {request.child_name},
short black hair,
round face,
big expressive eyes,
wearing a blue t-shirt and jeans,
friendly smile,
Pixar style cartoon character
"""

    image_paths = []

    for i, page in enumerate(pages):

        prompt = prompt = f"""
Children's picture book illustration.

Hero:
Cute {request.age}-year-old child named {request.child_name}.

Scene:
{page}

Style:
Disney Pixar animation style,
colorful children's book illustration,
bright lighting,
cute cartoon characters,
storybook illustration,
fantasy adventure,
animated movie style,
highly detailed cartoon art.
"""

        image_path = generate_image(prompt, f"page_{i+1}")
        image_paths.append(image_path)

    return {
        "story": story,
        "images": image_paths
    }