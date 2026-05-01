
"""
prompt_builder.py — Automatic Prompt Builder using Groq API

What this file does:
  - Takes simple user input (child name, age, disease, theme)
  - Uses Groq's LLaMA 3.3 70B model to build POWERFUL, detailed prompts
  - Returns two types of prompts:
      1. Story prompt  → sent to Ollama to write the full story
      2. Image prompts → sent to Stable Diffusion for each page illustration

Why Groq?
  - It's FREE (generous free tier at console.groq.com)
  - It's FAST — responses in under 1 second
  - LLaMA 3.3 70B is excellent at creative writing and prompt engineering
  - No GPU needed — it runs in the cloud

Why do we need a "prompt builder"?
  - Bad prompt:  "draw a sick child"
    → produces a sad, scary image — NOT what we want
  - Good prompt: "A cheerful 7-year-old girl named Emma wearing a superhero
    cape, holding a magical blue inhaler that glows like a lightsaber,
    cartoon style, Pixar-inspired, bright warm colors, friendly medical
    setting, no scary elements, child-safe illustration"
    → produces a beautiful, friendly, age-appropriate image

The prompt builder automatically creates the "good prompt" version
from just the basic user inputs.

FALLBACK:
  If no Groq API key is set, the builder uses a built-in rule-based
  system that still produces good prompts without any API calls.
"""

import json
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════
# DISEASE METAPHOR LIBRARY
# ════════════════════════════════════════════════════════════════

# This dictionary maps diseases to child-friendly metaphors.
# Used by both the Groq prompt AND the fallback rule-based system.
# The metaphor makes the disease non-scary and understandable.

DISEASE_METAPHORS = {
    "asthma": {
        "metaphor": "tiny wind dragons living in the lungs that sometimes breathe too much fire",
        "hero_tool": "a magical silver inhaler that calms the dragons with a cool mist",
        "color": "sky blue and silver",
        "setting": "a magical cloud kingdom",
        "villain": "the Smoke Monsters",
    },
    "diabetes": {
        "metaphor": "a sugar kingdom inside the body where the sugar gates need a special key called insulin",
        "hero_tool": "a golden glucose meter that reads the sugar map and a magic insulin pen",
        "color": "golden yellow and green",
        "setting": "the Sugar Kingdom inside the body",
        "villain": "the Sugar Chaos Goblins",
    },
    "fever": {
        "metaphor": "tiny fire soldiers inside the body fighting off invading germ monsters",
        "hero_tool": "a cool blue thermometer wand and a magical water shield",
        "color": "warm orange and cool blue",
        "setting": "the Body Fortress",
        "villain": "the Germ Army",
    },
    "cancer": {
        "metaphor": "some confused cells that forgot the rules and need brave medicine heroes to teach them",
        "hero_tool": "a rainbow medicine shield and a brave doctor sidekick",
        "color": "rainbow and gold",
        "setting": "the Cell City inside the body",
        "villain": "the Confused Cell Bullies",
    },
    "epilepsy": {
        "metaphor": "the brain's electricity sometimes having a big dance party all at once",
        "hero_tool": "a special brain helmet that keeps the electricity dancing in rhythm",
        "color": "purple and electric blue",
        "setting": "the Electric Brain City",
        "villain": "the Chaos Sparks",
    },
    "allergies": {
        "metaphor": "the body's guard army being a little too enthusiastic and fighting harmless things",
        "hero_tool": "a magical allergy shield bracelet and an EpiPen sword",
        "color": "green and white",
        "setting": "the Immune Kingdom",
        "villain": "the Overprotective Guard Bots",
    },
    "heart disease": {
        "metaphor": "the heart being a brave drum that needs to keep its perfect beat",
        "hero_tool": "a magical stethoscope that listens to the heart's song",
        "color": "red and pink",
        "setting": "the Heart Castle",
        "villain": "the Blockage Boulders",
    },
    "anxiety": {
        "metaphor": "a worry cloud that sometimes grows too big and needs a sunshine friend to shrink it",
        "hero_tool": "a magical breathing bubble and a calm-down cape",
        "color": "soft yellow and lavender",
        "setting": "the Thought Garden",
        "villain": "the Worry Clouds",
    },
}

def get_disease_info(disease: str) -> dict:
    """
    Looks up the disease metaphor info.
    If the disease isn't in our library, creates a generic friendly version.
    
    Parameters:
      disease: the disease name (e.g., "asthma")
    
    Returns:
      A dict with metaphor, hero_tool, color, setting, villain
    """
    # Try exact match first (case-insensitive)
    disease_lower = disease.lower().strip()

    for key, info in DISEASE_METAPHORS.items():
        if key in disease_lower or disease_lower in key:
            return info

    # Not found — create a generic friendly version
    return {
        "metaphor": f"a tricky challenge inside the body that brave heroes can learn to manage",
        "hero_tool": f"a magical medicine kit with special tools for {disease}",
        "color": "bright rainbow colors",
        "setting": "the Body Adventure Land",
        "villain": f"the {disease.title()} Troublemakers",
    }


# ════════════════════════════════════════════════════════════════
# GROQ-POWERED PROMPT BUILDER
# ════════════════════════════════════════════════════════════════

async def build_prompts_with_groq(
    child_name: str,
    age: int,
    disease: str,
    theme: Optional[str],
    num_pages: int,
) -> dict:
    """
    Uses Groq's LLaMA 3.3 70B to build powerful, detailed prompts.
    
    This function sends a meta-prompt to Groq asking it to:
    1. Create a strong story-writing prompt for Ollama
    2. Create strong image prompts for each page for Stable Diffusion
    
    Parameters:
      child_name: e.g., "Emma"
      age: e.g., 7
      disease: e.g., "asthma"
      theme: e.g., "Spider-Man" or None
      num_pages: how many pages (e.g., 6)
    
    Returns:
      {
        "story_prompt": "Write a story where...",
        "image_style_base": "Pixar-style cartoon, ...",
        "page_image_prompts": ["Page 1: Emma standing...", ...]
      }
    """
    from groq import AsyncGroq
    # AsyncGroq: the async Groq client (doesn't block while waiting for response)

    disease_info = get_disease_info(disease)
    theme_text = f"The child's favorite theme/superhero is: {theme}. Incorporate this into the story and visuals." if theme else "No specific theme — use a general superhero/adventure theme."

    # ── The meta-prompt we send to Groq ──────────────────────────────────
    # This is a prompt ABOUT building prompts (meta-prompting)
    meta_prompt = f"""You are an expert children's book author and AI prompt engineer specializing in medical education for kids.

Your task: Build powerful, detailed prompts for generating a personalized medical storybook for a child.

CHILD DETAILS:
- Name: {child_name}
- Age: {age} years old
- Medical condition to explain: {disease}
- Theme preference: {theme_text}
- Number of story pages: {num_pages}

DISEASE CONTEXT:
- Child-friendly metaphor: {disease_info['metaphor']}
- Hero's special tool: {disease_info['hero_tool']}
- Story colors: {disease_info['color']}
- Story setting: {disease_info['setting']}
- Story villain (non-scary): {disease_info['villain']}

YOUR OUTPUT must be a valid JSON object with exactly these keys:

{{
  "story_prompt": "A detailed, specific prompt for an LLM to write a {num_pages}-page children's story. Must include: character details, the disease metaphor, emotional arc, age-appropriate language rules, page structure requirements, and tone guidelines.",
  
  "image_style_base": "A reusable base style string for ALL images. Must specify: art style, color palette, mood, what to AVOID (scary elements, needles shown graphically, etc.), and technical quality tags for Stable Diffusion.",
  
  "page_image_prompts": [
    "Detailed image prompt for page 1 — describe the exact scene, character pose, expression, background, lighting",
    "Detailed image prompt for page 2 — ...",
    ... (exactly {num_pages} prompts)
  ]
}}

RULES FOR STORY PROMPT:
- The child ({child_name}) must be the HERO, not a victim
- Disease must be explained through the metaphor, never scary medical terms
- Each page should have a clear emotional beat (curiosity → fear → courage → understanding → triumph)
- Language must be appropriate for age {age} ({"simple sentences, big fun words" if age <= 7 else "slightly more complex, still fun and friendly"})
- EACH PAGE: exactly 3 to 4 VERY SHORT, simple sentences — children's book style, easy to read for kids
- Each sentence must be SHORT (maximum 10-15 words) and paint a clear picture a child can imagine
- End with empowerment: the child understands and can manage their condition
- Output format: PAGE 1: [text] PAGE 2: [text] ... no IMAGE: lines needed

RULES FOR IMAGE PROMPTS:
- Style: Pixar/Disney-inspired cartoon, warm and friendly
- NEVER include: needles shown graphically, blood, scary hospital scenes, crying children
- MAXIMUM 1-2 characters per image — solo or duo shots only, NO crowds or groups
- ALWAYS include: bright colors, smiling or determined expressions, magical/fantasy elements
- Each prompt must be 50-80 words, highly specific
- Include: character description, action, background, lighting, mood, art style tags
- Add Stable Diffusion quality tags: "masterpiece, best quality, highly detailed, 8k, vibrant colors"

Return ONLY the JSON object, no other text."""

    try:
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        # AsyncGroq: creates the Groq API client with our API key

        logger.info("🤖 Sending meta-prompt to Groq for prompt building...")

        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            # model: which AI model to use (llama-3.3-70b-versatile)

            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert AI prompt engineer for children's medical education. "
                        "You always output valid JSON. You create prompts that are warm, "
                        "empowering, and never scary for children."
                    )
                },
                {
                    "role": "user",
                    "content": meta_prompt
                }
            ],
            temperature=0.7,
            # temperature: controls creativity
            # 0.0 = very predictable, 1.0 = very creative
            # 0.7 = good balance for creative but consistent prompts

            max_tokens=4000,
            # max_tokens: maximum length of the response
            # 4000 tokens ≈ ~3000 words — enough for all our prompts

            response_format={"type": "json_object"},
            # response_format: forces Groq to return valid JSON
            # This prevents parsing errors
        )

        # Extract the text response
        raw_response = response.choices[0].message.content
        # response.choices[0]: the first (and only) response
        # .message.content: the actual text

        # Parse JSON
        result = json.loads(raw_response)
        # json.loads(): converts JSON string → Python dict

        logger.info("✅ Groq prompt building complete")
        return result

    except Exception as e:
        logger.warning(f"⚠️ Groq API failed: {e}. Falling back to rule-based builder.")
        # If Groq fails for any reason, fall back to our built-in builder
        return build_prompts_rule_based(child_name, age, disease, theme, num_pages)


# ════════════════════════════════════════════════════════════════
# FALLBACK: RULE-BASED PROMPT BUILDER (no API needed)
# ════════════════════════════════════════════════════════════════

def build_prompts_rule_based(
    child_name: str,
    age: int,
    disease: str,
    theme: Optional[str],
    num_pages: int,
) -> dict:
    """
    Builds strong prompts using pre-written rules and templates.
    
    This runs when:
    - No Groq API key is set
    - Groq API call fails
    
    Still produces high-quality prompts — just less personalized than Groq.
    """
    disease_info = get_disease_info(disease)
    theme_line = f"inspired by {theme}" if theme else "with a superhero adventure theme"
    age_language = "very simple words, short sentences" if age <= 7 else "fun vocabulary, medium sentences"

    # ── Story Prompt ──────────────────────────────────────────────────────
    story_prompt = f"""Write a {num_pages}-page children's storybook for a {age}-year-old child named {child_name}.

STORY CONCEPT:
{child_name} is a brave young hero {theme_line} who discovers they have {disease}.
Instead of being scary, {disease} is portrayed as: {disease_info['metaphor']}.
{child_name}'s special tool is: {disease_info['hero_tool']}.
The story takes place in: {disease_info['setting']}.
The challenge to overcome: {disease_info['villain']}.

STORY STRUCTURE:
Page 1: Introduce {child_name} as a normal, happy, brave child. Set the scene.
Page 2: {child_name} first notices something different about their body. Curious, not scared.
Page 3: A wise friendly character (doctor, magical creature, or mentor) appears and explains using the metaphor.
Page 4: {child_name} receives and learns to use {disease_info['hero_tool']}.
Page 5: {child_name} faces a challenge with {disease_info['villain']} and wins using their tool.
Page 6: {child_name} feels empowered, teaches a friend, and celebrates.

WRITING RULES:
- Language level: {age_language}
- Tone: warm, encouraging, adventurous — NEVER scary or sad
- EACH PAGE: exactly 3 to 4 VERY SHORT, simple sentences — no more, no less
- Each sentence must be SHORT (maximum 10-15 words) — easy for kids to read
- Use big, vivid, fun words a child would love
- {child_name} is ALWAYS the hero, never a victim
- No medical jargon — use the metaphor language throughout
- Each sentence should paint a clear picture a child can imagine

OUTPUT FORMAT — follow this EXACTLY:
PAGE 1:
[5-7 sentences]

PAGE 2:
[5-7 sentences]

(continue for all {num_pages} pages)"""

    # ── Image Style Base ──────────────────────────────────────────────────
    image_style_base = (
        f"Pixar-Disney inspired children's book illustration, "
        f"cartoon style, {disease_info['color']} color palette, "
        f"warm soft lighting, friendly and cheerful atmosphere, "
        f"solo character focus, single main subject, 1 or 2 characters maximum, "
        f"highly detailed, vibrant colors, "
        f"child-safe content, no scary elements, no realistic medical equipment, "
        f"magical fantasy medical setting, "
        f"dreamshaper style, illustration, concept art, "
        f"smooth cel shading, clean lines, professional children's book art, "
        f"masterpiece, best quality, 8k uhd"
    )

    # ── Per-page Image Prompts ────────────────────────────────────────────
    page_scenes = [
        f"A cheerful brave {age}-year-old child named {child_name} standing heroically in {disease_info['setting']}, wearing a colorful superhero outfit {theme_line}, big smile, arms wide open, golden sunlight, welcoming scene",
        f"{child_name} looking curious and slightly puzzled, touching their chest/body with a wondering expression, magical sparkles around them showing something special inside, {disease_info['setting']} background, soft warm colors",
        f"A friendly wise magical doctor character (cartoon animal or fairy) explaining to {child_name} using a glowing magical diagram showing {disease_info['metaphor']}, both characters smiling, educational but fun atmosphere",
        f"{child_name} holding {disease_info['hero_tool']} which glows with magical energy, looking confident and powerful, superhero pose, {disease_info['color']} magical aura surrounding them, triumphant expression",
        f"{child_name} bravely facing {disease_info['villain']} (cute non-scary cartoon monsters), using {disease_info['hero_tool']} to defeat them with a beam of colorful light, action scene, dynamic pose, victory imminent",
        f"{child_name} standing triumphantly with friends and family celebrating, holding a 'Hero Certificate', {disease_info['setting']} decorated with balloons and confetti, everyone smiling, warm golden sunset, empowering finale",
    ]

    # If more pages requested, cycle through scenes
    page_image_prompts = []
    for i in range(num_pages):
        scene = page_scenes[i % len(page_scenes)]
        # Add quality tags to every prompt
        full_prompt = (
            f"{scene}, "
            f"{image_style_base}, "
            f"masterpiece, best quality, highly detailed"
        )
        page_image_prompts.append(full_prompt)

    return {
        "story_prompt": story_prompt,
        "image_style_base": image_style_base,
        "page_image_prompts": page_image_prompts,
    }


# ════════════════════════════════════════════════════════════════
# IMAGE PROMPT FROM PAGE TEXT — the key function for story-matched images
# ════════════════════════════════════════════════════════════════

async def build_image_prompt_from_page_text(
    page_text: str,
    page_number: int,
    child_name: str,
    age: int,
    disease: str,
    theme: Optional[str],
    image_style_base: str,
) -> str:
    """
    Reads the ACTUAL written story text for a page and builds an image prompt
    that illustrates exactly what is happening in that paragraph.

    This is called AFTER the story is written — not before.
    That way the image always matches the story content on that page.

    Example:
      Page text: "Emma used her silver inhaler and the wind dragons calmed down,
                  their fire turning into soft blue snowflakes."
      → Image prompt: "A brave 7-year-old girl named Emma holding a glowing silver
                       inhaler, magical blue snowflakes swirling around friendly
                       cartoon dragons whose fire is turning to ice, triumphant
                       expression, Pixar style, sky blue palette..."

    Parameters:
      page_text:        the actual story paragraph for this page
      page_number:      which page (1, 2, 3...)
      child_name:       e.g., "Emma"
      age:              e.g., 7
      disease:          e.g., "asthma"
      theme:            e.g., "Spider-Man" or None
      image_style_base: the consistent art style string for all pages

    Returns:
      A detailed Stable Diffusion image prompt string
    """
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here":
        return await _groq_image_prompt_from_text(
            page_text, page_number, child_name, age, disease, theme, image_style_base
        )
    else:
        return _rule_based_image_prompt_from_text(
            page_text, page_number, child_name, age, disease, theme, image_style_base
        )


async def _groq_image_prompt_from_text(
    page_text: str,
    page_number: int,
    child_name: str,
    age: int,
    disease: str,
    theme: Optional[str],
    image_style_base: str,
) -> str:
    """
    Uses Groq to read the page text and write a matching image prompt.

    Groq is perfect for this — it's fast enough to call once per page
    without slowing down the pipeline significantly.
    """
    from groq import AsyncGroq

    theme_note = f"The child's theme/favorite character is {theme}." if theme else ""

    prompt = f"""You are a world-class Stable Diffusion prompt engineer specializing in children's book illustrations.

A children's storybook page has been written with rich detail (300-400 words).
Your job: read every detail in this page and write ONE powerful Stable Diffusion image prompt
that captures the most visually striking and story-accurate scene from this page.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STORY PAGE {page_number} — FULL TEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{page_text}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHARACTER INFO:
- Hero: {child_name}, a {age}-year-old child
- Medical condition (shown as metaphor): {disease}
- {theme_note}

BASE ART STYLE (use this for every image):
{image_style_base}

YOUR TASK — write a Stable Diffusion prompt that:
1. Identifies the SINGLE most visually powerful moment in this page's text
2. Describes {child_name}'s exact pose, expression, and action in that moment
3. Describes every important character, object, or creature mentioned in the text
4. Describes the setting/background with specific colors and lighting from the story
5. Captures the emotional tone of this specific page (wonder? courage? joy? discovery?)
6. Incorporates the art style base above
7. Ends with SD quality boosters: masterpiece, best quality, highly detailed, 8k, vibrant colors

STRICT RULES:
- NO scary elements, NO blood, NO realistic needles, NO crying
- All medical elements must appear as magical/fantasy versions
- Characters must look warm, friendly, and child-appropriate
- Length: 80-120 words (rich and specific)

Return ONLY the image prompt. No explanations, no labels, just the prompt text."""

    try:
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You write Stable Diffusion prompts for children's book illustrations. "
                        "You always make the image match the exact scene in the story text. "
                        "Output only the prompt, no explanations."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            # Lower temperature = more faithful to the story text
            max_tokens=300,
            # 300 tokens = enough for an 80-120 word detailed image prompt
        )
        image_prompt = response.choices[0].message.content.strip()
        logger.info(f"✅ Groq built image prompt for page {page_number}")
        return image_prompt

    except Exception as e:
        logger.warning(f"⚠️ Groq image prompt failed for page {page_number}: {e}")
        return _rule_based_image_prompt_from_text(
            page_text, page_number, child_name, age, disease, theme, image_style_base
        )


def _rule_based_image_prompt_from_text(
    page_text: str,
    page_number: int,
    child_name: str,
    age: int,
    disease: str,
    theme: Optional[str],
    image_style_base: str,
) -> str:
    """
    Fallback: builds an image prompt from page text using keyword extraction.

    Scans the page text for key words (actions, emotions, objects) and
    builds a prompt that reflects the actual content of the page.
    """
    disease_info = get_disease_info(disease)
    theme_note = f"wearing {theme}-inspired outfit," if theme else ""

    # ── Extract emotional tone from text ─────────────────────────────────
    # Look for emotion keywords in the page text to set the right mood
    text_lower = page_text.lower()

    if any(w in text_lower for w in ["happy", "celebrate", "cheer", "triumph", "won", "victory", "proud"]):
        emotion = "triumphant smile, arms raised in victory, golden light"
    elif any(w in text_lower for w in ["brave", "courage", "fight", "battle", "face", "challenge"]):
        emotion = "determined expression, heroic pose, confident stance"
    elif any(w in text_lower for w in ["learn", "discover", "understand", "explain", "teach", "know"]):
        emotion = "curious wide eyes, leaning forward with interest, wonder on face"
    elif any(w in text_lower for w in ["scared", "worried", "nervous", "strange", "different"]):
        emotion = "slightly puzzled but brave expression, soft reassuring light around them"
    elif any(w in text_lower for w in ["friend", "family", "together", "help", "care"]):
        emotion = "warm smile, surrounded by caring friends, cozy atmosphere"
    else:
        emotion = "cheerful expression, bright eyes, adventurous mood"

    # ── Extract key objects/actions from text ─────────────────────────────
    # Pull out the most important visual elements mentioned in the text
    key_elements = []

    if disease_info["hero_tool"].split()[1] in text_lower:
        # Check if the hero's tool is mentioned (e.g., "inhaler", "meter")
        key_elements.append(f"holding {disease_info['hero_tool']} glowing with magical energy")

    if any(w in text_lower for w in ["dragon", "monster", "villain", "enemy", "battle"]):
        key_elements.append(f"facing {disease_info['villain']} (cute friendly cartoon style)")

    if any(w in text_lower for w in ["doctor", "nurse", "friend", "fairy", "guide"]):
        key_elements.append("with a friendly cartoon helper character nearby")

    elements_str = ", ".join(key_elements) if key_elements else f"in {disease_info['setting']}"

    # ── Build the final prompt ────────────────────────────────────────────
    # Take the first sentence of the page text as a scene description hint
    first_sentence = page_text.split(".")[0].strip()[:120]
    # [:120] = take at most 120 characters to keep the prompt focused

    image_prompt = (
        f"Children's book illustration: {child_name}, a brave {age}-year-old child hero, "
        f"{theme_note} {emotion}, {elements_str}. "
        f"Scene inspired by: '{first_sentence}'. "
        f"{image_style_base}, "
        f"masterpiece, best quality, highly detailed, vibrant colors, 8k"
    )

    return image_prompt


# ════════════════════════════════════════════════════════════════
# MAIN ENTRY POINT — called by the story generator
# ════════════════════════════════════════════════════════════════

async def build_prompts(
    child_name: str,
    age: int,
    disease: str,
    theme: Optional[str],
    num_pages: int,
) -> dict:
    """
    Main function — automatically chooses Groq or rule-based builder.
    
    If GROQ_API_KEY is set → uses Groq (better quality)
    If not set → uses rule-based builder (still good, no API needed)
    
    Parameters:
      child_name, age, disease, theme, num_pages: user inputs
    
    Returns:
      {
        "story_prompt": str,           ← send this to Ollama
        "image_style_base": str,       ← base style for all images
        "page_image_prompts": [str]    ← one prompt per page for Stable Diffusion
      }
    """
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here":
        # Groq key is configured — use the AI-powered builder
        logger.info("🚀 Using Groq API for prompt building")
        return await build_prompts_with_groq(child_name, age, disease, theme, num_pages)
    else:
        # No key — use the rule-based fallback
        logger.info("📝 Using rule-based prompt builder (set GROQ_API_KEY for better results)")
        return build_prompts_rule_based(child_name, age, disease, theme, num_pages)
