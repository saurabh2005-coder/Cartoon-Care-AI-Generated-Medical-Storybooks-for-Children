"""
prepare_dataset.py — Prepares training images for LoRA fine-tuning

What this script does:
  1. Reads images from dataset/images/
  2. Resizes them all to 512x512 (required by Stable Diffusion)
  3. Auto-generates a caption (.txt file) for each image
  4. Saves everything to dataset/processed/ ready for training

Why do we need captions?
  - LoRA training is "supervised" — the model learns by seeing
    image + text pairs together
  - The caption tells the model WHAT is in the image
  - We include a special "trigger word" in every caption: "cartoon_medical_style"
  - After training, using this trigger word in any prompt activates the style

HOW TO RUN:
  python prepare_dataset.py

  Before running:
  1. Put your training images in: ai/lora_training/dataset/images/
  2. Run this script
  3. Check ai/lora_training/dataset/processed/ for the results
"""

import os
import sys
import shutil
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


# ── Paths ─────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
# __file__ = path to this script
# .parent = the folder containing this script (lora_training/)

RAW_IMAGES_DIR = SCRIPT_DIR / "dataset" / "images"
# Where you put your raw training images

PROCESSED_DIR = SCRIPT_DIR / "dataset" / "processed"
# Where the resized + captioned images will be saved

# ── The trigger word ───────────────────────────────────────────────────────
# This word will be in EVERY caption during training.
# After training, adding this word to any SD prompt activates our style.
TRIGGER_WORD = "cartoon_medical_style"

# ── Base caption template ──────────────────────────────────────────────────
# Every image gets this caption. The trigger word is at the start.
# This teaches the model: "when you see cartoon_medical_style, draw like THIS"
BASE_CAPTION = (
    f"{TRIGGER_WORD}, Disney Pixar cartoon illustration style, "
    "vibrant colors, magical fantasy setting, expressive characters, "
    "warm soft lighting, highly detailed, children's animation style, "
    "friendly and cheerful, professional cartoon art"
)


def resize_image(input_path: Path, output_path: Path, size: int = 512):
    """
    Resizes an image to size×size pixels and saves it.

    Why 512x512?
      Stable Diffusion v1.5 was trained on 512x512 images.
      Training on the same size gives the best results.

    Parameters:
      input_path:  path to the original image
      output_path: where to save the resized image
      size:        target size in pixels (512 or 768)
    """
    from PIL import Image
    # PIL = Python Imaging Library (installed as Pillow)

    img = Image.open(input_path)
    # Image.open(): loads the image file into memory

    # Convert to RGB (removes alpha channel from PNGs, handles grayscale)
    img = img.convert("RGB")
    # Some images have 4 channels (RGBA) — SD needs exactly 3 (RGB)

    # Resize to square using high-quality Lanczos resampling
    img = img.resize((size, size), Image.LANCZOS)
    # Image.LANCZOS: the best resampling algorithm for downscaling
    # It produces sharper results than bilinear or nearest-neighbor

    # Save as PNG (lossless)
    img.save(output_path, format="PNG")


def create_caption_file(image_path: Path, custom_caption: str = None):
    """
    Creates a .txt caption file next to the image.

    The caption file must have the SAME name as the image but with .txt extension.
    Example: page_1.png → page_1.txt

    The training script reads these pairs automatically.

    Parameters:
      image_path:     path to the image file
      custom_caption: optional custom caption (uses BASE_CAPTION if None)
    """
    caption = custom_caption or BASE_CAPTION
    # Use custom caption if provided, otherwise use the base template

    # Create the .txt file with the same name as the image
    caption_path = image_path.with_suffix(".txt")
    # .with_suffix(".txt"): replaces .png with .txt in the path

    caption_path.write_text(caption, encoding="utf-8")
    # write_text(): writes the caption string to the file


def prepare_dataset(target_size: int = 512):
    """
    Main function — processes all images in the raw images folder.

    Steps:
      1. Create output folder
      2. For each image: resize → save → create caption
      3. Print summary
    """
    print("\n🎨 Cartoon Care — LoRA Dataset Preparation")
    print("=" * 50)

    # ── Check input folder ────────────────────────────────────────────────
    if not RAW_IMAGES_DIR.exists():
        RAW_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        print(f"\n📁 Created input folder: {RAW_IMAGES_DIR}")
        print("   Please add your training images there and run again.")
        print(f"\n   Read dataset_guide.md for instructions on what images to use.")
        return

    # Find all image files
    image_extensions = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
    # A set of valid image file extensions

    image_files = [
        f for f in RAW_IMAGES_DIR.iterdir()
        # iterdir(): lists all files in the folder
        if f.suffix.lower() in image_extensions
        # f.suffix: the file extension (e.g., ".png")
        # .lower(): make it lowercase so ".PNG" also matches
    ]

    if not image_files:
        print(f"\n⚠️  No images found in: {RAW_IMAGES_DIR}")
        print("   Add PNG/JPG images and run again.")
        print(f"   Read dataset_guide.md for guidance.")
        return

    print(f"\n✅ Found {len(image_files)} images to process")
    print(f"   Target size: {target_size}×{target_size} pixels")
    print(f"   Trigger word: '{TRIGGER_WORD}'")

    # ── Create output folder ──────────────────────────────────────────────
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\n📁 Output folder: {PROCESSED_DIR}")

    # ── Process each image ────────────────────────────────────────────────
    print("\nProcessing images...")
    success_count = 0

    for i, img_path in enumerate(image_files, 1):
        # i = image number (1, 2, 3...)
        # img_path = path to the image file

        # Create output filename: image_001.png, image_002.png, etc.
        output_name = f"image_{i:03d}.png"
        # f"image_{i:03d}" = "image_" + i padded to 3 digits
        # i=1 → "image_001", i=10 → "image_010", i=100 → "image_100"

        output_path = PROCESSED_DIR / output_name

        try:
            # Resize and save the image
            resize_image(img_path, output_path, size=target_size)

            # Create the caption file
            create_caption_file(output_path)

            print(f"  ✅ {img_path.name} → {output_name}")
            success_count += 1

        except Exception as e:
            print(f"  ❌ {img_path.name}: {e}")

    # ── Summary ───────────────────────────────────────────────────────────
    print(f"\n{'='*50}")
    print(f"✅ Dataset prepared: {success_count}/{len(image_files)} images")
    print(f"   Saved to: {PROCESSED_DIR}")
    print(f"\nNext step: Run train_lora.py to start training")
    print(f"  python train_lora.py")


def generate_synthetic_dataset(num_images: int = 20):
    """
    ALTERNATIVE: Generate training images using the base SD model itself.

    This is called "self-distillation" — we use SD to generate images
    in the style we want, then train LoRA on those images.

    This is useful if you don't have real training images yet.

    Parameters:
      num_images: how many synthetic images to generate
    """
    print(f"\n🤖 Generating {num_images} synthetic training images...")
    print("   This uses your RTX 4050 to generate training data.")
    print("   Each image takes ~10-15 seconds.\n")

    # Import here to avoid loading SD at module import time
    from ai.image_generator.generator import generate_single_image, NEGATIVE_PROMPT

    RAW_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Prompts that represent our target style
    # We cycle through these to get variety in the training data
    style_prompts = [
        "cartoon medical illustration, brave 7-year-old child hero wearing superhero cape, "
        "holding glowing magical inhaler, friendly cloud kingdom background, "
        "Pixar Disney style, bright sky blue colors, warm lighting, child-safe",

        "cartoon children's book illustration, kind owl doctor character explaining "
        "to a curious child, glowing magical body diagram floating in air, "
        "educational fun atmosphere, warm colors, Pixar style",

        "cartoon illustration, cheerful child hero defeating cute friendly cartoon monsters "
        "with magical medicine tool, action pose, bright rainbow colors, "
        "children's book style, no scary elements",

        "cartoon medical storybook illustration, child celebrating victory, "
        "friends and family cheering, golden confetti, magical setting, "
        "warm sunset colors, Pixar Disney inspired, joyful scene",

        "cartoon illustration, brave child holding glowing magical medicine kit, "
        "superhero pose, colorful fantasy medical setting, bright warm colors, "
        "children's book art style, empowering scene",

        "cartoon children's book page, friendly cartoon doctor animal character "
        "with stethoscope, smiling child patient, cozy magical clinic, "
        "soft warm lighting, Pixar style, educational and fun",

        "cartoon illustration, child hero learning about their special power, "
        "magical sparkles showing body systems as friendly creatures, "
        "wonder and curiosity expression, bright colors, children's book style",

        "cartoon medical illustration, child using magical inhaler device, "
        "cool blue mist swirling around friendly dragons, triumphant expression, "
        "sky blue and silver palette, Pixar style",
    ]

    for i in range(num_images):
        # Cycle through prompts
        prompt = style_prompts[i % len(style_prompts)]
        # i % len(style_prompts): cycles 0,1,2,...,7,0,1,2,...

        output_path = str(RAW_IMAGES_DIR / f"synthetic_{i+1:03d}.png")

        print(f"  Generating image {i+1}/{num_images}...")

        try:
            generate_single_image(
                prompt=prompt,
                negative_prompt=NEGATIVE_PROMPT,
                output_path=output_path,
                width=512,
                height=512,
                num_inference_steps=25,
                guidance_scale=7.5,
            )
            print(f"  ✅ synthetic_{i+1:03d}.png")

        except Exception as e:
            print(f"  ❌ Failed: {e}")

    print(f"\n✅ Generated {num_images} synthetic training images")
    print(f"   Saved to: {RAW_IMAGES_DIR}")
    print(f"\nNow run: python prepare_dataset.py")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Prepare LoRA training dataset")
    parser.add_argument(
        "--mode",
        choices=["prepare", "generate"],
        default="prepare",
        help="prepare: process existing images | generate: create synthetic images with SD"
    )
    parser.add_argument(
        "--size",
        type=int,
        default=512,
        choices=[512, 768],
        help="Target image size (512 or 768)"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=20,
        help="Number of synthetic images to generate (--mode generate only)"
    )
    args = parser.parse_args()

    if args.mode == "generate":
        generate_synthetic_dataset(num_images=args.count)
    else:
        prepare_dataset(target_size=args.size)
