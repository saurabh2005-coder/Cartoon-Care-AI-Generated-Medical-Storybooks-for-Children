"""
generator.py — Story generation using Ollama + Automatic Prompt Builder

Updated flow:
  1. build_prompts()  → Groq builds a strong story-writing prompt + image style base
  2. call_ollama()    → Ollama writes the full story using that prompt
  3. parse_story()    → Split raw text into individual pages
  4. For EACH page:
       build_image_prompt_from_page_text() → Groq reads the actual page text
                                             and writes an image prompt that
                                             illustrates EXACTLY that scene

This means every image is directly tied to what's written on that page.
Page 3 talks about dragons? The image shows dragons.
Page 5 shows a victory? The image shows a celebration.
"""

import re
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def generate_story_text(
    child_name: str,
    age: int,
    disease: str,
    theme: Optional[str],
    num_pages: int,
) -> list:
    """
    Full pipeline — returns pages where each image prompt matches its page text.

    Returns:
      [
        {
          "page_number": 1,
          "text": "Emma stood at the edge of the cloud kingdom...",
          "image_prompt": "Emma standing at glowing cloud gates, wide-eyed with
                           wonder, silver inhaler on her belt, Pixar style..."
                           ← this was built FROM the text above, not pre-written
        },
        ...
      ]
    """
    from ai.prompt_builder.prompt_builder import (
        build_prompts,
        build_image_prompt_from_page_text,
        get_disease_info,
    )

    # ── Step 1: Build the story-writing prompt + image style base ─────────
    # At this point we only build:
    #   - story_prompt      → what to send to Ollama
    #   - image_style_base  → the consistent art style for ALL pages
    # We do NOT build page image prompts yet — we need the story text first
    logger.info(f"🔨 Building story prompt for {child_name}, {disease}...")
    prompt_data = await build_prompts(
        child_name=child_name,
        age=age,
        disease=disease,
        theme=theme,
        num_pages=num_pages,
    )

    story_prompt = prompt_data["story_prompt"]
    image_style_base = prompt_data.get("image_style_base", "")
    # image_style_base: the consistent art style string reused on every page
    # e.g., "Pixar-Disney cartoon, sky blue palette, warm lighting, child-safe..."

    # ── Step 2: Send story prompt to Ollama → get the written story ───────
    logger.info("📖 Sending story prompt to Ollama...")
    raw_story = await call_ollama(story_prompt, child_name, disease, num_pages)

    # ── Step 3: Parse the raw story text into individual page objects ─────
    pages = parse_story_into_pages(raw_story, num_pages, child_name, disease)
    logger.info(f"📄 Parsed {len(pages)} pages from Ollama response")

    # ── Step 4: For each page, build an image prompt FROM its actual text ──
    # This is the key step — we now read what Ollama actually wrote
    # and generate an image prompt that illustrates that specific scene
    logger.info("🎨 Building page-specific image prompts from story text...")

    # Build all image prompts concurrently (in parallel) for speed
    # asyncio.gather() runs multiple async functions at the same time
    # Instead of waiting 0.5s × 6 pages = 3s, we wait ~0.5s total
    image_prompt_tasks = [
        build_image_prompt_from_page_text(
            page_text=page["text"],
            page_number=page["page_number"],
            child_name=child_name,
            age=age,
            disease=disease,
            theme=theme,
            image_style_base=image_style_base,
        )
        for page in pages
        # This creates one task per page — all run at the same time
    ]

    image_prompts = await asyncio.gather(*image_prompt_tasks)
    # asyncio.gather(*tasks): runs all tasks concurrently and waits for all to finish
    # Returns a list of results in the same order as the tasks

    # ── Step 5: Attach each image prompt to its matching page ─────────────
    for page, image_prompt in zip(pages, image_prompts):
        # zip() pairs each page with its corresponding image prompt
        # zip([page1, page2, page3], [prompt1, prompt2, prompt3])
        # → [(page1, prompt1), (page2, prompt2), (page3, prompt3)]
        page["image_prompt"] = image_prompt

    logger.info(f"✅ Story complete: {len(pages)} pages with matched image prompts")
    return pages


async def call_ollama(prompt: str, child_name: str = "the child", disease: str = "their condition", num_pages: int = 6) -> str:
    """
    Sends the story prompt to Ollama and returns the generated story text.

    Ollama runs locally — no internet needed for this step.
    Make sure Ollama is running: open a terminal and run 'ollama serve'
    """
    from app.config import settings

    try:
        import ollama as ollama_client

        logger.info(f"🦙 Calling Ollama ({settings.OLLAMA_MODEL})...")

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: ollama_client.chat(
                model=settings.OLLAMA_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a warm, creative children's book author. "
                            "You write engaging, age-appropriate stories that are "
                            "never scary. You always follow the exact format requested. "
                            "Each page must have a clear scene that can be illustrated."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                options={
                    "temperature": 0.8,
                    "num_predict": 1500,
                }
            )
        )
        return response["message"]["content"]

    except Exception as e:
        logger.error(f"❌ Ollama call failed: {e}")
        logger.info("💡 Make sure Ollama is running: run 'ollama serve' in a terminal")
        return _placeholder_story(child_name, disease, num_pages)


def parse_story_into_pages(raw_story: str, num_pages: int, child_name: str, disease: str) -> list:
    """
    Splits Ollama's raw story text into individual page dicts.

    Ollama returns text like:
      PAGE 1:
      Emma stood bravely at the cloud gates...

      PAGE 2:
      She noticed the wind dragons stirring...

    We split on "PAGE X:" and return a list of {"page_number": N, "text": "..."}
    """
    pages = []

    # Split on "PAGE 1:", "PAGE 2:", etc. (case-insensitive)
    parts = re.split(r"PAGE\s+\d+\s*:", raw_story, flags=re.IGNORECASE)

    # parts[0] = text before "PAGE 1:" (usually empty or a title)
    # parts[1] = content of page 1
    # parts[2] = content of page 2, etc.
    page_parts = [p.strip() for p in parts if p.strip()]

    for i, part in enumerate(page_parts[:num_pages]):
        # Remove any "IMAGE:" line that Ollama might have included
        # We don't need it — we build our own image prompts from the text
        text_only = re.split(r"IMAGE\s*:", part, flags=re.IGNORECASE)[0].strip()

        # Collapse multiple newlines into a single space
        text_clean = re.sub(r"\n+", " ", text_only).strip()

        if text_clean:
            pages.append({
                "page_number": i + 1,
                "text": text_clean,
                # image_prompt added later in generate_story_text()
            })

    # Fill any missing pages with fallback content
    while len(pages) < num_pages:
        n = len(pages) + 1
        pages.append({
            "page_number": n,
            "text": (
                f"{child_name} took a deep breath and smiled. "
                f"Every day they understood {disease} a little better. "
                f"And with that knowledge, {child_name} felt unstoppable."
            ),
        })

    return pages[:num_pages]


def _placeholder_story(child_name: str = "the child", disease: str = "their condition", num_pages: int = 6) -> str:
    """
    Returns a generic placeholder story using the actual child name and disease
    when Ollama is not running. Each disease gets a unique story via the metaphor library.
    """
    from ai.prompt_builder.prompt_builder import get_disease_info
    info = get_disease_info(disease)

    pages = [
        f"PAGE 1:\n{child_name} was a cheerful and brave young hero who loved going on adventures every single day.\nThey wore their favorite colorful outfit and carried a special backpack full of magical tools.\n{child_name} had a big heart and an even bigger smile that lit up every room.\nEveryone in the neighborhood knew {child_name} as the bravest kid on the block.\nToday was about to become the most important adventure of all.",

        f"PAGE 2:\n{child_name} noticed something curious happening inside their body one afternoon.\nIt felt like {info['metaphor']}.\nIt was not scary — just strange and new, like discovering a secret door.\n{child_name} pressed a hand to their chest and listened carefully.\n\"I wonder what is going on in there,\" {child_name} said with wide, curious eyes.",

        f"PAGE 3:\n{child_name}'s family took them to see the kindest doctor in the whole town.\nThe doctor had a warm smile and a coat covered in tiny glowing stars.\nUsing a magical glowing map, the doctor showed {child_name} exactly what was happening inside.\n\"You have {disease},\" the doctor said gently, \"and it is something we can manage together.\"\n{child_name} listened carefully and felt brave instead of scared.",

        f"PAGE 4:\nThe doctor handed {child_name} something truly special — {info['hero_tool']}.\nIt glowed with a soft magical light, perfectly made just for {child_name}.\n\"This is your hero tool,\" the doctor said proudly. \"It will help you every single day.\"\n{child_name} held it carefully and practiced using it three times.\nWith every practice, {child_name} felt stronger and more confident.",

        f"PAGE 5:\nOne day, {info['villain']} appeared and tried to cause trouble.\n{child_name} felt the familiar feeling begin — but this time, {child_name} was completely ready.\nWith a calm breath and steady hands, {child_name} reached for {info['hero_tool']}.\nThe magical tool worked perfectly, and the trouble faded away like morning mist.\n{child_name} stood tall and smiled — nothing could stop a hero who was prepared.",

        f"PAGE 6:\n{child_name} went back to school feeling stronger and prouder than ever before.\nThey told their best friends all about {disease} and how to manage it like a true hero.\nThe whole class listened with wide eyes and cheered for {child_name}.\nThat evening, {child_name} drew a picture of their adventure and hung it on the wall.\n{child_name} knew that with the right tools and a brave heart, anything was possible.",
    ]

    return "\n\n".join(pages[:num_pages])
