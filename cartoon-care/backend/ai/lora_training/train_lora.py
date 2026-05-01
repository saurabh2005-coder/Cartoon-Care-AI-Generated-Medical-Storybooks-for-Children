"""
train_lora.py — LoRA fine-tuning for cartoon medical illustration style

What is LoRA?
  LoRA = Low-Rank Adaptation
  
  Instead of retraining the entire 4GB Stable Diffusion model (which would
  take days and require 24GB+ VRAM), LoRA adds small "adapter" layers on top.
  
  Think of it like adding a thin filter over a camera lens:
  - The camera (SD model) stays the same
  - The filter (LoRA) changes the style of every photo
  
  LoRA training:
  - Takes 5-30 minutes on RTX 4050
  - Produces a small ~50-150MB file
  - Can be loaded/unloaded instantly
  - Doesn't modify the original SD model

How LoRA works technically:
  - Neural networks have "weight matrices" (tables of numbers)
  - LoRA adds two small matrices (A and B) next to each weight matrix
  - Instead of changing the big matrix, we only train A and B
  - A × B approximates the change we want to make
  - This is "low-rank" because A and B are much smaller than the original

HOW TO RUN:
  1. First prepare your dataset:
     python prepare_dataset.py
  
  2. Then train:
     python train_lora.py
  
  3. The trained LoRA will be saved to:
     outputs/lora/cartoon_medical.safetensors

TRAINING TIME on RTX 4050:
  - 20 images, 500 steps: ~10-15 minutes
  - 50 images, 1000 steps: ~25-35 minutes
  - 100 images, 2000 steps: ~60-90 minutes
"""

import os
import sys
import math
import logging
from pathlib import Path

# Add backend to path so we can import our modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s — %(message)s")


# ── Training Configuration ────────────────────────────────────────────────
# These are the "hyperparameters" — settings that control how training works.
# You can adjust these to get better results.

class LoRAConfig:
    """
    All training settings in one place.
    
    Think of these like the settings on a camera:
    - Some control quality (rank, steps)
    - Some control speed (batch_size, gradient_accumulation)
    - Some control stability (learning_rate, lr_scheduler)
    """

    # ── Model ─────────────────────────────────────────────────────────────
    base_model = "runwayml/stable-diffusion-v1-5"
    # The SD model we're fine-tuning on top of

    # ── Dataset ───────────────────────────────────────────────────────────
    dataset_dir = str(Path(__file__).parent / "dataset" / "processed")
    # Where the prepared training images are

    # ── Output ────────────────────────────────────────────────────────────
    output_dir = str(Path(__file__).parent.parent.parent.parent / "outputs" / "lora")
    # Where to save the trained LoRA weights
    # Goes to: cartoon-care/outputs/lora/

    lora_filename = "cartoon_medical.safetensors"
    # The name of the output file
    # .safetensors is a safe, fast format for model weights

    # ── LoRA Architecture ─────────────────────────────────────────────────
    lora_rank = 16
    # rank = how many "dimensions" the LoRA adapters have
    # Higher rank = more expressive but larger file and slower training
    # rank 4  = very small, fast, less expressive
    # rank 16 = good balance (recommended)
    # rank 64 = very expressive, large file, slow

    lora_alpha = 16
    # alpha controls the "strength" of the LoRA during training
    # Usually set equal to rank
    # Higher alpha = stronger style influence

    # ── Training Steps ────────────────────────────────────────────────────
    max_train_steps = 2000
    # 779 images × ~2-3 steps per image = good coverage
    # More steps = better style learning from the Disney dataset

    # ── Learning Rate ─────────────────────────────────────────────────────
    learning_rate = 1e-4
    # How fast the model learns (1e-4 = 0.0001)
    # Too high = unstable training, bad results
    # Too low = very slow learning
    # 1e-4 is the standard starting point for LoRA

    lr_scheduler = "cosine"
    # How the learning rate changes over time
    # "cosine" = starts at learning_rate, smoothly decreases to 0
    # This prevents the model from "forgetting" what it learned early on

    lr_warmup_steps = 100
    # For the first 100 steps, slowly increase the learning rate
    # This prevents unstable training at the start

    # ── Batch Size ────────────────────────────────────────────────────────
    train_batch_size = 1
    # How many images to process at once
    # RTX 4050 with 6GB VRAM: use 1 (safe) or 2 (if you have headroom)
    # Larger batch = more stable training but more VRAM

    gradient_accumulation_steps = 4
    # Simulate a larger batch by accumulating gradients over 4 steps
    # Effective batch size = train_batch_size × gradient_accumulation_steps = 4
    # This gives stability without needing more VRAM

    # ── Image Size ────────────────────────────────────────────────────────
    resolution = 512
    # Training image size — must match your dataset images
    # 512 = standard SD resolution, works on 6GB VRAM
    # 768 = higher quality but needs ~8GB VRAM

    # ── Mixed Precision ───────────────────────────────────────────────────
    mixed_precision = "fp16"
    # fp16 = float16 (half precision)
    # Uses half the VRAM of fp32 with minimal quality loss
    # Essential for training on 6GB VRAM

    # ── Checkpointing ─────────────────────────────────────────────────────
    save_steps = 250
    # Save a checkpoint every 250 steps
    # Lets you resume training if it crashes
    # Also lets you compare quality at different training stages

    # ── Trigger Word ──────────────────────────────────────────────────────
    trigger_word = "cartoon_medical_style"
    # The word that activates this LoRA style in prompts
    # After training, add this to any SD prompt to get our style


config = LoRAConfig()
# Create one instance of the config that the whole script uses


def check_prerequisites():
    """
    Checks that everything is ready before starting training.
    Returns True if ready, False if something is missing.
    """
    print("\n🔍 Checking prerequisites...")

    # Check 1: Dataset exists
    dataset_path = Path(config.dataset_dir)
    if not dataset_path.exists():
        print(f"❌ Dataset not found: {dataset_path}")
        print("   Run: python prepare_dataset.py first")
        return False

    image_files = list(dataset_path.glob("*.png")) + list(dataset_path.glob("*.jpg"))
    if len(image_files) < 5:
        print(f"❌ Not enough training images: {len(image_files)} found, need at least 5")
        return False

    print(f"✅ Dataset: {len(image_files)} images found")

    # Check 2: GPU
    import torch
    if not torch.cuda.is_available():
        print("⚠️  No GPU — training will be slow on CPU (~2-4 hours)")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != "y":
            return False
    else:
        vram = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"✅ GPU: {torch.cuda.get_device_name(0)} ({vram:.1f}GB VRAM)")

    # Check 3: Required packages (use new import paths)
    try:
        import diffusers
        import transformers
        import accelerate
        import safetensors
        print(f"✅ diffusers {diffusers.__version__}")
        print(f"✅ transformers {transformers.__version__}")
        print(f"✅ safetensors installed")
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        return False

    return True


def load_training_data(dataset_dir: str):
    """
    Loads training images and their captions into memory.
    
    Returns a list of (image_tensor, caption) pairs.
    
    Parameters:
      dataset_dir: path to the folder with processed images + caption files
    
    Returns:
      List of dicts: [{"image": tensor, "caption": str}, ...]
    """
    from PIL import Image
    import torch
    from torchvision import transforms

    dataset_path = Path(dataset_dir)

    # Define image preprocessing
    # This converts PIL images to PyTorch tensors that the model can process
    image_transform = transforms.Compose([
        transforms.Resize(config.resolution),
        # Resize to training resolution

        transforms.CenterCrop(config.resolution),
        # Crop to exact square size

        transforms.ToTensor(),
        # Convert PIL Image (0-255) to PyTorch tensor (0.0-1.0)

        transforms.Normalize([0.5], [0.5]),
        # Normalize to range (-1.0, 1.0)
        # SD was trained with this normalization
    ])

    training_data = []

    for img_path in sorted(dataset_path.glob("*.png")):
        # sorted(): process images in alphabetical order (consistent)

        # Load image
        img = Image.open(img_path).convert("RGB")
        img_tensor = image_transform(img)
        # img_tensor shape: [3, 512, 512] (channels, height, width)

        # Load caption
        caption_path = img_path.with_suffix(".txt")
        if caption_path.exists():
            caption = caption_path.read_text(encoding="utf-8").strip()
        else:
            # Fallback caption if no .txt file found
            caption = f"{config.trigger_word}, cartoon medical children's book illustration"

        training_data.append({
            "image": img_tensor,
            "caption": caption,
        })

    logger.info(f"Loaded {len(training_data)} training samples")
    return training_data


def train_lora():
    """
    LoRA training using diffusers + PEFT (modern API, compatible with diffusers 0.29+).
    
    Uses the PEFT library's LoraConfig which is the current standard approach.
    """
    import torch
    from diffusers import StableDiffusionPipeline, DDPMScheduler, AutoencoderKL, UNet2DConditionModel
    from transformers import CLIPTextModel, CLIPTokenizer
    from torch.utils.data import DataLoader, Dataset
    from torch.optim import AdamW
    from torch.optim.lr_scheduler import CosineAnnealingLR
    from safetensors.torch import save_file

    print("\n🚀 Starting LoRA Training")
    print("=" * 50)
    print(f"   Base model:     {config.base_model}")
    print(f"   Dataset:        {config.dataset_dir}")
    print(f"   Output:         {config.output_dir}/{config.lora_filename}")
    print(f"   LoRA rank:      {config.lora_rank}")
    print(f"   Training steps: {config.max_train_steps}")
    print(f"   Learning rate:  {config.learning_rate}")
    print(f"   Resolution:     {config.resolution}×{config.resolution}")
    print("=" * 50)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    print(f"\n🎮 Using device: {device.upper()}")

    # ── Load model components ─────────────────────────────────────────────
    print("\n📦 Loading base model components...")

    tokenizer = CLIPTokenizer.from_pretrained(config.base_model, subfolder="tokenizer")

    text_encoder = CLIPTextModel.from_pretrained(
        config.base_model, subfolder="text_encoder", torch_dtype=dtype
    ).to(device)

    vae = AutoencoderKL.from_pretrained(
        config.base_model, subfolder="vae", torch_dtype=dtype
    ).to(device)

    unet = UNet2DConditionModel.from_pretrained(
        config.base_model, subfolder="unet", torch_dtype=dtype
    ).to(device)

    noise_scheduler = DDPMScheduler.from_pretrained(
        config.base_model, subfolder="scheduler"
    )
    print("✅ Base model loaded")

    # ── Add LoRA using PEFT ───────────────────────────────────────────────
    print("\n🔧 Adding LoRA layers with PEFT...")

    try:
        from peft import LoraConfig, get_peft_model
        # PEFT = Parameter-Efficient Fine-Tuning library by HuggingFace
        # This is the modern, recommended way to add LoRA

        # Freeze base model
        vae.requires_grad_(False)
        text_encoder.requires_grad_(False)

        # Define LoRA config
        lora_config = LoraConfig(
            r=config.lora_rank,
            # r = rank of the LoRA matrices

            lora_alpha=config.lora_alpha,
            # alpha = scaling factor

            target_modules=["to_q", "to_v", "to_k", "to_out.0"],
            # Which layers to apply LoRA to
            # These are the attention projection layers in the UNet
            # q = query, k = key, v = value, out = output

            lora_dropout=0.1,
            # Small dropout for regularization (prevents overfitting)

            bias="none",
            # Don't add LoRA to bias terms
        )

        unet = get_peft_model(unet, lora_config)
        # get_peft_model(): wraps the UNet with LoRA adapters

        unet.print_trainable_parameters()
        # Prints: "trainable params: X || all params: Y || trainable%: Z%"

    except ImportError:
        print("⚠️  PEFT not installed, installing now...")
        import subprocess
        subprocess.run(["venv/Scripts/pip.exe", "install", "peft", "--quiet"], check=True)
        from peft import LoraConfig, get_peft_model
        lora_config = LoraConfig(r=config.lora_rank, lora_alpha=config.lora_alpha,
                                  target_modules=["to_q", "to_v"], lora_dropout=0.1, bias="none")
        unet = get_peft_model(unet, lora_config)

    # ── Load training data ────────────────────────────────────────────────
    print("\n📚 Loading training data...")
    training_data = load_training_data(config.dataset_dir)

    class LoRADataset(Dataset):
        def __init__(self, data):
            self.data = data
        def __len__(self):
            return len(self.data)
        def __getitem__(self, idx):
            return self.data[idx]

    dataloader = DataLoader(
        LoRADataset(training_data),
        batch_size=config.train_batch_size,
        shuffle=True,
    )
    print(f"✅ {len(training_data)} training samples loaded")

    # ── Optimizer ─────────────────────────────────────────────────────────
    optimizer = AdamW(
        filter(lambda p: p.requires_grad, unet.parameters()),
        # Only optimize trainable (LoRA) parameters
        lr=config.learning_rate,
    )

    lr_scheduler = CosineAnnealingLR(optimizer, T_max=config.max_train_steps)

    # ── Training loop ─────────────────────────────────────────────────────
    print(f"\n🏋️  Training for {config.max_train_steps} steps...")
    print("   Checkpoints saved every 500 steps to outputs/lora/\n")

    os.makedirs(config.output_dir, exist_ok=True)

    unet.train()
    global_step = 0
    running_loss = 0.0

    while global_step < config.max_train_steps:
        for batch in dataloader:
            if global_step >= config.max_train_steps:
                break

            images = batch["image"].to(device, dtype=dtype)
            captions = batch["caption"]

            # Encode images → latents
            with torch.no_grad():
                latents = vae.encode(images).latent_dist.sample()
                latents = latents * vae.config.scaling_factor

            # Add noise
            noise = torch.randn_like(latents)
            timesteps = torch.randint(
                0, noise_scheduler.config.num_train_timesteps,
                (images.shape[0],), device=device
            ).long()
            noisy_latents = noise_scheduler.add_noise(latents, noise, timesteps)

            # Encode text
            with torch.no_grad():
                text_inputs = tokenizer(
                    captions, padding="max_length",
                    max_length=tokenizer.model_max_length,
                    truncation=True, return_tensors="pt"
                ).to(device)
                encoder_hidden_states = text_encoder(text_inputs.input_ids)[0]

            # Predict noise
            noise_pred = unet(noisy_latents, timesteps, encoder_hidden_states).sample

            # Loss
            loss = torch.nn.functional.mse_loss(noise_pred.float(), noise.float())
            loss.backward()

            running_loss += loss.item()

            if (global_step + 1) % config.gradient_accumulation_steps == 0:
                torch.nn.utils.clip_grad_norm_(
                    filter(lambda p: p.requires_grad, unet.parameters()), 1.0
                )
                # clip_grad_norm_: prevents exploding gradients (training instability)
                optimizer.step()
                lr_scheduler.step()
                optimizer.zero_grad()

            global_step += 1

            # Log progress
            if global_step % 50 == 0:
                avg_loss = running_loss / 50
                running_loss = 0.0
                lr = optimizer.param_groups[0]["lr"]
                print(f"  Step {global_step:4d}/{config.max_train_steps} | Loss: {avg_loss:.4f} | LR: {lr:.2e}")

            # Save checkpoint
            if global_step % 500 == 0:
                ckpt_path = os.path.join(config.output_dir, f"checkpoint_{global_step}.safetensors")
                _save_peft_lora(unet, ckpt_path)
                print(f"  💾 Checkpoint: {ckpt_path}")

    # ── Save final LoRA ───────────────────────────────────────────────────
    final_path = os.path.join(config.output_dir, config.lora_filename)
    _save_peft_lora(unet, final_path)

    print(f"\n{'='*50}")
    print(f"✅ Training complete!")
    print(f"   LoRA saved: {final_path}")
    print(f"\n   Add '{config.trigger_word}' to any prompt to activate the Disney style!")


def _save_peft_lora(unet, output_path: str):
    """Saves only the LoRA (trainable) weights from a PEFT-wrapped UNet."""
    from safetensors.torch import save_file

    lora_state_dict = {
        name: param.data.cpu()
        for name, param in unet.named_parameters()
        if param.requires_grad
        # Only save the LoRA parameters (the ones we actually trained)
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    save_file(lora_state_dict, output_path)
    logger.info(f"Saved LoRA weights: {output_path} ({len(lora_state_dict)} tensors)")


if __name__ == "__main__":
    print("\n🎨 Cartoon Care — LoRA Fine-Tuning")
    print("=" * 50)

    # Check everything is ready
    if not check_prerequisites():
        print("\n❌ Prerequisites not met. Fix the issues above and try again.")
        sys.exit(1)

    # Start training
    try:
        train_lora()
    except KeyboardInterrupt:
        print("\n\n⚠️  Training interrupted by user.")
        print("   Checkpoints were saved — you can resume from the last checkpoint.")
