"""
apply_lora.py — Test and compare LoRA results

What this script does:
  - Generates the SAME image prompt twice:
      1. Without LoRA (base SD model)
      2. With LoRA (our trained cartoon medical style)
  - Saves both side-by-side so you can compare the difference

HOW TO RUN:
  python apply_lora.py

  This requires:
  - The trained LoRA file at: outputs/lora/cartoon_medical.safetensors
  - Run train_lora.py first if you haven't already
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))


def compare_with_without_lora():
    """
    Generates the same prompt with and without LoRA for comparison.
    Saves both images so you can see the style difference.
    """
    from diffusers import StableDiffusionPipeline
    import torch
    from PIL import Image

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    lora_path = str(
        Path(__file__).parent.parent.parent.parent / "outputs" / "lora" / "cartoon_medical.safetensors"
    )

    if not os.path.exists(lora_path):
        print(f"❌ LoRA file not found: {lora_path}")
        print("   Run train_lora.py first to train the LoRA.")
        return

    # Test prompt — same for both images
    test_prompt = (
        "cartoon_medical_style, "
        "a brave 7-year-old girl named Emma holding a glowing silver inhaler, "
        "tiny friendly wind dragons with storm-cloud scales flying around her, "
        "magical cloud kingdom background, superhero cape, "
        "bright sky blue and silver colors, warm soft lighting, "
        "Pixar Disney inspired, children's book illustration, "
        "masterpiece, best quality, highly detailed"
    )

    negative_prompt = (
        "ugly, deformed, scary, blood, realistic, dark, sad, "
        "bad anatomy, blurry, low quality, watermark"
    )

    output_dir = str(Path(__file__).parent.parent.parent.parent / "outputs" / "lora_test")
    os.makedirs(output_dir, exist_ok=True)

    print("\n🎨 LoRA Comparison Test")
    print("=" * 50)
    print(f"Prompt: {test_prompt[:80]}...")

    # ── Image 1: Without LoRA ─────────────────────────────────────────────
    print("\n1️⃣  Generating WITHOUT LoRA...")
    pipeline = StableDiffusionPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        torch_dtype=dtype,
        safety_checker=None,
        requires_safety_checker=False,
    ).to(device)

    generator = torch.Generator(device=device).manual_seed(42)
    # Same seed = same random starting point = fair comparison

    result_no_lora = pipeline(
        prompt=test_prompt,
        negative_prompt=negative_prompt,
        width=512, height=512,
        num_inference_steps=30,
        guidance_scale=7.5,
        generator=generator,
    )
    img_no_lora = result_no_lora.images[0]
    no_lora_path = os.path.join(output_dir, "without_lora.png")
    img_no_lora.save(no_lora_path)
    print(f"   ✅ Saved: {no_lora_path}")

    # ── Image 2: With LoRA ────────────────────────────────────────────────
    print("\n2️⃣  Generating WITH LoRA...")
    pipeline.load_lora_weights(lora_path)
    # load_lora_weights(): applies our trained LoRA on top of the base model

    generator = torch.Generator(device=device).manual_seed(42)
    # Same seed again for fair comparison

    result_with_lora = pipeline(
        prompt=test_prompt,
        negative_prompt=negative_prompt,
        width=512, height=512,
        num_inference_steps=30,
        guidance_scale=7.5,
        generator=generator,
    )
    img_with_lora = result_with_lora.images[0]
    with_lora_path = os.path.join(output_dir, "with_lora.png")
    img_with_lora.save(with_lora_path)
    print(f"   ✅ Saved: {with_lora_path}")

    # ── Create side-by-side comparison ───────────────────────────────────
    print("\n📊 Creating side-by-side comparison...")
    comparison = Image.new("RGB", (1024 + 20, 512 + 60), color=(240, 240, 240))
    # Create a white canvas: 2 images side by side + padding

    comparison.paste(img_no_lora, (0, 30))
    comparison.paste(img_with_lora, (512 + 20, 30))

    comparison_path = os.path.join(output_dir, "comparison.png")
    comparison.save(comparison_path)

    print(f"\n✅ Comparison saved: {comparison_path}")
    print("\nOpen the comparison image to see the style difference!")
    print("Left = without LoRA | Right = with LoRA")


if __name__ == "__main__":
    compare_with_without_lora()
