"""
image_generator/generator.py — Image generation using Stable Diffusion

What this file does:
  - Loads the Stable Diffusion model once (heavy — ~4GB download on first run)
  - Generates one cartoon illustration per story page
  - Uses the image prompt built by Groq from the actual page text
  - Saves each image as a PNG file in outputs/story_{id}/

How Stable Diffusion works (simple explanation):
  1. You give it a text prompt: "A brave girl holding a glowing inhaler..."
  2. It starts with random noise (like TV static)
  3. Over ~20 steps, it gradually "denoises" the image guided by your prompt
  4. The result is a unique image that matches your description

Why HuggingFace diffusers?
  - Free and open source
  - Runs locally on your computer (no API costs)
  - Works on GPU (fast) or CPU (slow but works)
  - Supports LoRA fine-tuning (Step 5)

Hardware requirements:
  - GPU (NVIDIA recommended): ~4GB VRAM, generates in ~10-30 seconds per image
  - CPU only: works but takes ~3-10 minutes per image
  - The code automatically detects and uses the best available hardware
"""

import os
import asyncio
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

_sd_pipeline = None

# ── LoRA trigger word — prepended to EVERY image prompt automatically ─────
LORA_TRIGGER = "cartoon_medical_style"
# This activates the Disney-style LoRA we trained in Step 5.
# It's added automatically — no need to include it in prompts manually.

def _get_lora_path() -> Optional[str]:
    """Returns the LoRA path if the trained file exists, else None."""
    # __file__ = .../cartoon-care/backend/ai/image_generator/generator.py
    # Go up 3 levels: image_generator → ai → backend → cartoon-care/
    # Then into outputs/lora/
    lora_path = os.path.normpath(os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "..", "..",
        "outputs", "lora", "cartoon_medical.safetensors"
    ))
    if os.path.exists(lora_path):
        logger.info(f"🎨 Disney LoRA found: {lora_path}")
        return lora_path
    logger.info("ℹ️  No LoRA file found — using base SD model")
    return None


def get_device() -> str:
    """
    Detects the best available hardware for image generation.

    Returns:
      "cuda"  → NVIDIA GPU (fastest, ~10-30s per image)
      "mps"   → Apple Silicon GPU (fast, ~20-40s per image)
      "cpu"   → CPU only (slowest, ~3-10 min per image)

    Why this matters:
      Stable Diffusion is a neural network with billions of operations.
      A GPU can do thousands of these in parallel — a CPU does them one by one.
    """
    try:
        import torch
        # torch: PyTorch — the deep learning framework that runs SD

        if torch.cuda.is_available():
            # cuda = NVIDIA GPU
            gpu_name = torch.cuda.get_device_name(0)
            logger.info(f"🎮 GPU detected: {gpu_name}")
            return "cuda"

        elif torch.backends.mps.is_available():
            # mps = Apple Silicon (M1/M2/M3 Mac)
            logger.info("🍎 Apple Silicon GPU detected")
            return "mps"

        else:
            logger.info("💻 No GPU detected — using CPU (image generation will be slow)")
            return "cpu"

    except ImportError:
        logger.warning("⚠️ PyTorch not installed — cannot generate images")
        return "cpu"


def get_torch_dtype():
    """
    Returns the best data type for the current hardware.

    float16 (half precision):
      - Uses half the memory of float32
      - Supported by NVIDIA GPUs and Apple Silicon
      - Slightly less precise but fine for images

    float32 (full precision):
      - Required for CPU (CPU doesn't support float16 well)
      - Uses more memory but more compatible
    """
    import torch
    device = get_device()

    if device == "cuda":
        return torch.float16   # GPU: use float16 to save VRAM
    elif device == "mps":
        return torch.float16   # Apple Silicon: use float16
    else:
        return torch.float32   # CPU: must use float32


def load_pipeline(lora_path: Optional[str] = None):
    """Loads SD pipeline and auto-applies Disney LoRA if available."""
    global _sd_pipeline
    if _sd_pipeline is not None:
        return _sd_pipeline

    logger.info(f"🎨 Loading Stable Diffusion model: {settings.SD_MODEL_ID}")
    logger.info("   (First run downloads ~4GB — please wait...)")

    from diffusers import StableDiffusionPipeline
    import torch

    device = get_device()
    dtype = get_torch_dtype()

    pipeline = StableDiffusionPipeline.from_pretrained(
        settings.SD_MODEL_ID,
        torch_dtype=dtype,
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipeline = pipeline.to(device)

    # ── RTX 4050 optimizations ────────────────────────────────────────────
    if device == "cuda":
        pipeline.enable_attention_slicing()
        try:
            pipeline.enable_xformers_memory_efficient_attention()
            logger.info("✅ xformers memory efficient attention enabled")
        except Exception:
            logger.info("ℹ️  xformers not available — using standard attention")
        pipeline.enable_vae_slicing()
        logger.info("🎮 RTX 4050 optimizations applied")

    # ── Load LoRA weights ─────────────────────────────────────────────────
    detected_lora = _get_lora_path()
    if detected_lora:
        try:
            _load_lora_weights(pipeline, detected_lora, device, dtype)
        except Exception as e:
            logger.warning(f"⚠️  Could not load LoRA: {e} — using base model")

    _sd_pipeline = pipeline
    logger.info("✅ Stable Diffusion pipeline loaded and ready!")
    return pipeline


def _load_lora_weights(pipeline, lora_path: str, device: str, dtype):
    """
    Loads PEFT-trained LoRA weights by merging them directly into the UNet.

    PEFT saves keys like:
      base_model.model.down_blocks.0...attn1.to_q.lora_A.weight
      base_model.model.down_blocks.0...attn1.to_q.lora_B.weight

    We strip the 'base_model.model.' prefix and apply:
      W_new = W_orig + (lora_B @ lora_A) * (alpha / rank)
    This merges the LoRA style directly into the weights — no PEFT dependency needed.
    """
    import torch
    from safetensors.torch import load_file

    logger.info(f"🎨 Loading Disney LoRA from: {lora_path}")
    state_dict = load_file(lora_path)

    is_peft_format = any("base_model.model." in k for k in state_dict.keys())

    if is_peft_format:
        logger.info("   Merging PEFT LoRA weights into UNet...")
        unet_sd = pipeline.unet.state_dict()

        # Strip prefix to get clean keys: "down_blocks.0...to_q.lora_A.weight"
        clean = {k.replace("base_model.model.", ""): v for k, v in state_dict.items()}

        # Group lora_A and lora_B pairs by their base layer name
        lora_pairs = {}
        for key, val in clean.items():
            if ".lora_A.weight" in key:
                base = key.replace(".lora_A.weight", "")
                lora_pairs.setdefault(base, {})["A"] = val
            elif ".lora_B.weight" in key:
                base = key.replace(".lora_B.weight", "")
                lora_pairs.setdefault(base, {})["B"] = val

        alpha = 16.0
        rank = 16.0
        scale = alpha / rank
        merged = 0

        for base_key, mats in lora_pairs.items():
            if "A" not in mats or "B" not in mats:
                continue
            weight_key = base_key + ".weight"
            if weight_key not in unet_sd:
                continue
            orig = unet_sd[weight_key].to(torch.float32)
            A = mats["A"].to(torch.float32)
            B = mats["B"].to(torch.float32)
            # LoRA delta: B @ A gives the low-rank update
            delta = (B @ A) * scale
            if orig.shape == delta.shape:
                unet_sd[weight_key] = (orig + delta).to(dtype)
                merged += 1

        pipeline.unet.load_state_dict(unet_sd)
        logger.info(f"✅ Disney LoRA merged into {merged} UNet layers — cartoon_medical_style active!")
    else:
        # Standard diffusers LoRA format
        pipeline.load_lora_weights(lora_path)
        logger.info("✅ Disney LoRA loaded — cartoon_medical_style activated!")


def generate_single_image(
    prompt: str,
    negative_prompt: str,
    output_path: str,
    width: int = 768,
    height: int = 768,
    num_inference_steps: int = 35,
    guidance_scale: float = 8.5,
    seed: int = -1,
) -> str:
    """Generates image using local Stable Diffusion pipeline."""
    return _generate_local(prompt, negative_prompt, output_path,
                           width, height, num_inference_steps, guidance_scale, seed)


def _generate_via_hf_api(
    prompt: str,
    negative_prompt: str,
    output_path: str,
    width: int = 1024,
    height: int = 1024,
) -> str:
    """Uses HuggingFace Inference API with SD 3.5 Large — cloud-based, no GPU needed."""
    from huggingface_hub import InferenceClient
    import random

    logger.info(f"☁️  Generating via HF Inference API (SD 3.5 Large): {os.path.basename(output_path)}")

    client = InferenceClient(
        provider="fal-ai",
        api_key=settings.HF_TOKEN,
    )

    image = client.text_to_image(
        prompt=prompt,
        model="stabilityai/stable-diffusion-3.5-large",
        negative_prompt=negative_prompt,
    )

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    image.save(output_path, format="PNG")
    logger.info(f"✅ HF API image saved: {output_path}")
    return output_path


def _generate_local(
    prompt: str,
    negative_prompt: str,
    output_path: str,
    width: int = 768,
    height: int = 768,
    num_inference_steps: int = 35,
    guidance_scale: float = 8.5,
    seed: int = -1,
) -> str:
    """Fallback: generates using local Stable Diffusion pipeline."""
    if LORA_TRIGGER not in prompt:
        prompt = f"{LORA_TRIGGER}, {prompt}"

    pipeline = load_pipeline()

    logger.info(f"🖼️  Generating locally: {os.path.basename(output_path)}")

    import torch
    import random

    actual_seed = random.randint(0, 2**32 - 1) if seed == -1 else seed
    generator = torch.Generator(device=get_device()).manual_seed(actual_seed)

    result = pipeline(
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
        generator=generator,
    )

    image = result.images[0]
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    image.save(output_path, format="PNG")
    logger.info(f"✅ Local image saved: {output_path}")
    return output_path


# ── Standard negative prompt used for ALL images ─────────────────────────
# This tells Stable Diffusion what to NEVER draw
# A strong negative prompt is one of the biggest quality improvements

NEGATIVE_PROMPT = (
    # Anatomy / quality issues
    "ugly, deformed, disfigured, bad anatomy, bad proportions, extra limbs, "
    "missing limbs, floating limbs, disconnected limbs, mutation, mutated, "
    "extra fingers, fused fingers, too many fingers, long neck, "
    # Low quality
    "lowres, low quality, worst quality, blurry, jpeg artifacts, "
    "pixelated, grainy, noisy, out of focus, "
    # Style issues
    "realistic, photorealistic, 3d render, cgi, sketch, draft, "
    "watermark, text, signature, logo, username, "
    # Content safety
    "scary, frightening, horror, dark, gloomy, depressing, "
    "blood, gore, violence, death, crying child, tears, sad, "
    "realistic medical equipment, needles, syringes, hospital equipment, "
    "adult content, nsfw, nude, "
    # Composition issues
    "duplicate, cropped, cut off, out of frame, "
    "poorly drawn face, poorly drawn hands, poorly drawn feet, "
    # Background issues
    "busy background, cluttered background, messy background, "
    "background noise, distracting background, complex background, "
    # Multiple faces / crowd — NEW
    "multiple people, crowd, group of people, many faces, "
    "more than 2 people, multiple characters, group scene, "
    "classroom full of people, crowd scene, many children"
)


async def generate_images_for_story(story_id: int, pages_data: list) -> list:
    """
    Generates one image per story page using Stable Diffusion.

    This is the main function called by the story pipeline.

    Flow for each page:
      1. Get the image_prompt (built by Groq from the page text)
      2. Run Stable Diffusion with that prompt
      3. Save the image to outputs/story_{id}/page_{n}.png
      4. Add the image_path to the page dict

    Parameters:
      story_id:   used to create the output folder (e.g., outputs/story_1/)
      pages_data: list of page dicts, each must have "image_prompt" field

    Returns:
      Same list with "image_path" field added/updated for each page
    """
    # Create the output folder for this story
    story_dir = os.path.join(settings.OUTPUT_DIR, f"story_{story_id}")
    os.makedirs(story_dir, exist_ok=True)
    # e.g., creates: ./outputs/story_1/

    logger.info(f"🎨 Generating {len(pages_data)} images for story {story_id}...")

    # We generate images ONE AT A TIME (not in parallel)
    # Why? Because Stable Diffusion uses all available GPU memory for one image
    # Running two at once would cause an out-of-memory error

    loop = asyncio.get_event_loop()
    # get_event_loop(): gets the current async event loop

    for page in pages_data:
        page_num = page["page_number"]
        image_prompt = page.get("image_prompt", "")
        output_path = os.path.join(story_dir, f"page_{page_num}.png")

        if not image_prompt:
            # No prompt — skip image generation for this page
            logger.warning(f"⚠️ No image prompt for page {page_num} — skipping")
            page["image_path"] = None
            continue

        try:
            saved_path = await loop.run_in_executor(
                None,
                _generate_local,
                image_prompt,
                NEGATIVE_PROMPT,
                output_path,
                768,
                768,
                35,
                8.5,
                story_id * 1000 + page_num,
            )

            page["image_path"] = saved_path
            logger.info(f"✅ Page {page_num} image generated")

        except Exception as e:
            logger.error(f"❌ Image generation failed for page {page_num}: {e}")
            page["image_path"] = None
            # Don't crash the whole pipeline — just skip this image

    logger.info(f"✅ Image generation complete for story {story_id}")
    return pages_data


def unload_pipeline():
    """
    Frees the Stable Diffusion model from memory.

    Call this if you need to free up GPU/RAM after generation.
    The model will be reloaded on the next generation request.
    """
    global _sd_pipeline

    if _sd_pipeline is not None:
        del _sd_pipeline
        _sd_pipeline = None

        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                # empty_cache(): frees unused GPU memory back to the OS
        except ImportError:
            pass

        logger.info("🧹 Stable Diffusion pipeline unloaded from memory")
