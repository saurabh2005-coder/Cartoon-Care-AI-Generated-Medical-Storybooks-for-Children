# LoRA Training Dataset Guide

## What is this?

To train a LoRA that makes ALL generated images look like a consistent
"cartoon medical children's book" style, you need to collect training images
that represent that style.

## How many images do you need?

- Minimum: 15-20 images (will work but limited)
- Good: 30-50 images (recommended)
- Great: 80-100 images (best results)

## Where to find training images?

### Option 1: Free Stock Illustration Sites
- https://www.freepik.com — search "cartoon medical children"
- https://www.flaticon.com — search "cartoon doctor child"
- https://undraw.co — free SVG illustrations (export as PNG)
- https://storyset.com — free medical illustrations

### Option 2: Generate with base SD first
Run the app without LoRA first, generate 30-50 images using good prompts,
then use the BEST ones as training data. This is called "self-distillation".

### Option 3: Use existing children's medical book images
Scan or photograph pages from children's medical books (for personal/research use).

## What style should the images show?

Your training images should ALL share these visual characteristics:
- Cartoon/illustrated style (NOT photorealistic)
- Bright, warm, friendly colors
- Child characters (ages 5-11) as heroes
- Medical elements shown as magical/fantasy objects
- Clean backgrounds, simple compositions
- Pixar/Disney-inspired aesthetic

## Image requirements

- Format: PNG or JPG
- Size: at least 512x512 pixels (768x768 or larger is better)
- Content: child-safe, no scary elements
- Variety: different scenes, characters, settings

## Where to put the images

Place all training images in this folder:
  cartoon-care/backend/ai/lora_training/dataset/images/

The prepare_dataset.py script will handle the rest.

## Caption format

Each image needs a text caption describing it.
The prepare_dataset.py script auto-generates captions, but you can
also write them manually.

Good caption example:
  "cartoon medical illustration, brave child hero, friendly doctor,
   magical glowing medicine, bright colors, Pixar style, child-safe"

## Training time on RTX 4050

- 20 images × 100 steps = ~5-10 minutes
- 50 images × 200 steps = ~20-30 minutes
- 100 images × 500 steps = ~60-90 minutes
