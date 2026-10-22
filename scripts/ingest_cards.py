#!/usr/bin/env python3
"""
FatGoats TCG - Automated Card Ingestion Utility
Port new card images from "NEW CARDS/" into public/cards and public/cards_thumb,
and register them directly into cardsData.ts and questsData.ts.
"""

import os
import sys
import re
import json
import shutil
from pathlib import Path
from datetime import datetime
from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
NEW_CARDS_DIR = PROJECT_ROOT / "NEW CARDS"
ARCHIVE_DIR = NEW_CARDS_DIR / "_archived"
CARDS_DIR = PROJECT_ROOT / "public" / "cards"
THUMB_DIR = PROJECT_ROOT / "public" / "cards_thumb"
CARDS_DATA_FILE = PROJECT_ROOT / "src" / "data" / "cardsData.ts"
QUESTS_DATA_FILE = PROJECT_ROOT / "src" / "data" / "questsData.ts"
NEW_ARRIVALS_FILE = PROJECT_ROOT / "src" / "data" / "newArrivals.ts"

KNOWN_PRESETS = {
    "1792669364297": {
        "title": "Jacob",
        "subtitle": "The Ritz Cracker",
        "character": "Jacob",
        "cleanName": "37 - Jacob The Ritz Cracker",
        "rarity": "Legendary",
        "element": "Earth",
        "hp": 2200,
        "attack": 1800,
        "defense": 1950,
        "speed": 1400,
        "abilityName": "Buttery Crumble Barrage",
        "abilityDesc": "Unleashes a shower of golden salted crumbs that blinds enemies and buffs all snack-tier allies.",
        "flavorText": "\"You're toast, I'm crackers! Bow before the golden baked monarch.\"",
        "questTitle": "The Ritz Cracker Challenge",
        "questCategory": "Food & Feast",
        "questDifficulty": "Easy",
        "questInstruction": "Eat a Ritz cracker (or any savory cracker) with cheese, peanut butter, or solo in under 15 seconds without spilling a single crumb.",
        "questLore": "Jacob only acknowledges snack disciples who appreciate the buttery crunch of kings.",
        "questProofType": "photo",
        "questProofPrompt": "Take a photo of your golden cracker snack setup or the empty plate triumph!",
        "xpReward": 250,
    },
    "1792669557206": {
        "title": "Devin",
        "subtitle": "The Rat King",
        "character": "Devin",
        "cleanName": "38 - Devin The Rat King",
        "rarity": "Legendary",
        "element": "Dark",
        "hp": 2600,
        "attack": 2200,
        "defense": 2100,
        "speed": 1750,
        "abilityName": "Undercity Swarm Call",
        "abilityDesc": "Commands a subterranean legion of loyal sewer rodents to swarm enemy ranks, causing poison and confusion.",
        "flavorText": "\"All hail the king of scrap! The surface world belongs to mortals, but the undercity bows to me.\"",
        "questTitle": "Sewer Scavenger Triumph",
        "questCategory": "Creativity & Vibe",
        "questDifficulty": "Medium",
        "questInstruction": "Build a mini throne or royal crown for a pet, toy rat/mouse, or snack block of cheese, and declare your dominion.",
        "questLore": "Devin respects those who can turn humble scraps into royal undercity monuments.",
        "questProofType": "photo",
        "questProofPrompt": "Snap a photo of your scrap creation or royal cheese crown!",
        "xpReward": 300,
    },
    "1792669948596": {
        "title": "King Ritz",
        "subtitle": "Promise Thy Crackers",
        "character": "King Ritz",
        "cleanName": "39 - King Ritz Promise Thy Crackers",
        "rarity": "Legendary",
        "element": "Fire",
        "hp": 3500,
        "attack": 3000,
        "defense": 2800,
        "speed": 2100,
        "abilityName": "Royal Butter Decree",
        "abilityDesc": "Invokes the snack throne's ancient covenant, shielding allies with an impenetrable golden crust.",
        "flavorText": "\"Bow to the buttery king! Thy crackers shall be promised, salted, and crowned in glorious majesty.\"",
        "questTitle": "The Royal Toast to King Ritz",
        "questCategory": "Social & Comedy",
        "questDifficulty": "Medium",
        "questInstruction": "Stand up tall, hold up a cracker or snack like a royal scepter, and yell 'Bow to the Buttery King!' or text it to a friend.",
        "questLore": "To wield the power of King Ritz, you must swear allegiance to the Snack Kingdom with full dramatic flair.",
        "questProofType": "photo",
        "questProofPrompt": "Share a photo of your snack scepter coronation or message proof!",
        "xpReward": 350,
    },
    "1792670196982": {
        "title": "Stealth",
        "subtitle": "Leader of the Stealth Lee Clan",
        "character": "Stealth Lee",
        "cleanName": "40 - Stealth Leader of the Stealth Lee Clan",
        "rarity": "Legendary",
        "element": "Wind",
        "hp": 2700,
        "attack": 2400,
        "defense": 2300,
        "speed": 3200,
        "abilityName": "Night Shadow Shuriken Dance",
        "abilityDesc": "Vanishes into the forest canopy at supersonic speed, unleashing a vortex of leaf-concealed strikes.",
        "flavorText": "\"Youthful night shadow... By the moonlight, the Stealth Lee Clan strikes before a single leaf touches the earth.\"",
        "questTitle": "The Stealth Shinobi Stance",
        "questCategory": "Fitness & Action",
        "questDifficulty": "Legendary",
        "questInstruction": "Hold a deep ninja martial stance for 30 seconds or perform 15 silent ninja squats.",
        "questLore": "Only the swiftest warriors of the Stealth Lee Clan earn the right to summon its supreme leader.",
        "questProofType": "timer",
        "timerDuration": 30,
        "questProofPrompt": "Hold the ninja stance until the 30-second timer hits zero!",
        "xpReward": 400,
    },
    "1792670656685": {
        "title": "Yungdoor",
        "subtitle": "Reincarnated as a Door",
        "character": "Yungdoor",
        "cleanName": "41 - Yungdoor Reincarnated as a Door",
        "rarity": "Legendary",
        "element": "Arcane",
        "hp": 4000,
        "attack": 1200,
        "defense": 4500,
        "speed": 900,
        "abilityName": "Interdimensional Portal Warp",
        "abilityDesc": "Opens his ancient wooden gateway to absorb 100% of incoming damage and banishes enemy projectiles to the void.",
        "flavorText": "\"That time I became a portal... Do you have the key?! Knock three times if you seek the forbidden goat realm.\"",
        "questTitle": "The Gatekeeper's Knock",
        "questCategory": "Creativity & Vibe",
        "questDifficulty": "Easy",
        "questInstruction": "Walk up to any door, knock in a rhythmic secret code (tap-tap-pause-tap-tap), and whisper 'Do you have the key?'",
        "questLore": "Yungdoor's dimensional hinge resonates only with those who know how to address a portal with dignity.",
        "questProofType": "photo",
        "questProofPrompt": "Take a photo of the mystery door you knocked on or standing before the threshold!",
        "xpReward": 250,
    },
    "Gemini_Generated_Image_pbyq6tpbyq6tpbyq": {
        "title": "The FatGoats",
        "subtitle": "Unmatched Brotherhood",
        "character": "The FatGoats",
        "cleanName": "42 - The FatGoats Unmatched Brotherhood",
        "rarity": "Secret Rare",
        "element": "Celestial",
        "hp": 9999,
        "attack": 9999,
        "defense": 9999,
        "speed": 9999,
        "abilityName": "Unbreakable Bonds of Brotherhood",
        "abilityDesc": "Unites the power, humor, and loyalty of all FatGoats members into an omnipotent celestial blast.",
        "flavorText": "\"Unmatched brotherhood, unbreakable bonds! When the squad stands as one, no force in the cosmos can stop us.\"",
        "questTitle": "The Brotherhood High-Five",
        "questCategory": "Mastery",
        "questDifficulty": "Goat-Tier",
        "questInstruction": "High-five a friend/homie in real life, or send a heartfelt message to your group chat telling the boys they are GOATs.",
        "questLore": "The FatGoats' true strength comes from real brotherhood. Prove your loyalty to the crew.",
        "questProofType": "photo",
        "questProofPrompt": "Share a snapshot of the high-five or a screenshot of your brotherly message in the chat!",
        "xpReward": 1000,
    }
}

def get_highest_card_number():
    """Scans public/cards to find current highest number."""
    highest = 0
    if CARDS_DIR.exists():
        for file in CARDS_DIR.glob("*.png"):
            m = re.match(r"^(\d+)\s*-", file.stem)
            if m:
                num = int(m.group(1))
                if num > highest:
                    highest = num
    return highest

def generate_default_card_metadata(next_num: int, filename_stem: str):
    """Generates intelligent fallback metadata for any newly introduced card."""
    clean_title = re.sub(r"^\d+\s*-\s*", "", filename_stem)
    clean_title = clean_title.replace("_", " ").replace("-", " ").strip()
    words = [w.capitalize() for w in clean_title.split()]
    title = words[0] if words else f"Goat #{next_num:02d}"
    subtitle = " ".join(words[1:]) if len(words) > 1 else "The Awakened Legend"

    return {
        "title": title,
        "subtitle": subtitle,
        "character": title,
        "cleanName": f"{next_num:02d} - {title} {subtitle}".strip(),
        "rarity": "Legendary",
        "element": "Celestial",
        "hp": 1500 + (next_num * 50) % 2000,
        "attack": 1400 + (next_num * 45) % 1800,
        "defense": 1300 + (next_num * 40) % 1600,
        "speed": 1200 + (next_num * 35) % 1500,
        "abilityName": f"Radiant {title} Burst",
        "abilityDesc": f"Channels inner goat essence to empower allies and unleash celestial shockwaves.",
        "flavorText": f"\"From the uncharted cosmos emerges {title}, rewriting the legends of the goat realm.\"",
        "questTitle": f"The Rite of {title}",
        "questCategory": "Fitness & Action",
        "questDifficulty": "Medium",
        "questInstruction": f"Perform 12 high jumps or share this card's wisdom with a fellow card collector.",
        "questLore": f"{title} honors those with the courage to leap into greatness.",
        "questProofType": "photo",
        "questProofPrompt": f"Snap a triumphant photo completing the Rite of {title}!",
        "xpReward": 300,
    }

def process_image(src_path: Path, dest_png: Path, dest_thumb: Path):
    """Saves full-size PNG and creates optimized WebP thumbnail."""
    with Image.open(src_path) as img:
        img_rgb = img.convert("RGB")
        # Save high quality PNG
        img_rgb.save(dest_png, format="PNG", optimize=True)
        print(f"  [+] Saved full card: {dest_png.name}")

        # Create WebP thumbnail (width 600px, keep aspect ratio)
        w, h = img_rgb.size
        thumb_w = 600
        thumb_h = int(h * (thumb_w / float(w)))
        thumb = img_rgb.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        thumb.save(dest_thumb, format="WEBP", quality=85)
        print(f"  [+] Generated WebP thumb: {dest_thumb.name}")

def update_cards_data(new_cards):
    """Appends new card definitions to src/data/cardsData.ts."""
    if not CARDS_DATA_FILE.exists():
        print(f"Error: {CARDS_DATA_FILE} not found!")
        return

    content = CARDS_DATA_FILE.read_text(encoding="utf-8")
    
    # We want to insert new cards right before the final '];'
    last_bracket_idx = content.rfind("];")
    if last_bracket_idx == -1:
        print("Error: Could not locate closing '];' in cardsData.ts")
        return

    # Check if cards are already present
    cards_to_add = []
    for c in new_cards:
        if f'"{c["id"]}"' not in content:
            cards_to_add.append(c)

    if not cards_to_add:
        print("  [*] All cards are already registered in cardsData.ts.")
        return

    ts_entries = []
    for c in cards_to_add:
        entry = f"""  {{
    "id": "{c['id']}",
    "cardNumber": "{c['cardNumber']}",
    "fileName": "{c['fileName']}",
    "title": {json.dumps(c['title'])},
    "subtitle": {json.dumps(c['subtitle'])},
    "character": {json.dumps(c['character'])},
    "rarity": "{c['rarity']}",
    "element": "{c['element']}",
    "hp": {c['hp']},
    "attack": {c['attack']},
    "defense": {c['defense']},
    "speed": {c['speed']},
    "abilityName": {json.dumps(c['abilityName'])},
    "abilityDesc": {json.dumps(c['abilityDesc'])},
    "flavorText": {json.dumps(c['flavorText'])},
    "artistCredit": "FatGoats Studio",
    "imageUrl": "/cards/{c['fileName']}",
    "thumbUrl": "/cards_thumb/{c['thumbName']}",
    "isNew": true
  }}"""
        ts_entries.append(entry)

    # Need a leading comma if previous item exists
    prefix = content[:last_bracket_idx].rstrip()
    if not prefix.endswith(","):
        prefix += ","
    
    new_content = prefix + "\n" + ",\n".join(ts_entries) + "\n];\n"
    CARDS_DATA_FILE.write_text(new_content, encoding="utf-8")
    print(f"  [OK] Successfully registered {len(cards_to_add)} cards in cardsData.ts")

def update_quests_data(new_quests):
    """Appends new quest items to src/data/questsData.ts."""
    if not QUESTS_DATA_FILE.exists():
        print(f"Error: {QUESTS_DATA_FILE} not found!")
        return

    content = QUESTS_DATA_FILE.read_text(encoding="utf-8")
    last_bracket_idx = content.rfind("];")
    if last_bracket_idx == -1:
        print("Error: Could not locate closing '];' in questsData.ts")
        return

    quests_to_add = []
    for q in new_quests:
        if f"'{q['id']}'" not in content and f'"{q["id"]}"' not in content:
            quests_to_add.append(q)

    if not quests_to_add:
        print("  [*] All quests are already registered in questsData.ts.")
        return

    ts_entries = []
    for q in quests_to_add:
        timer_prop = f"    timerDuration: {q['timerDuration']},\n" if q.get('timerDuration') else ""
        entry = f"""  {{
    id: '{q['id']}',
    cardId: '{q['cardId']}',
    cardTitle: {json.dumps(q['cardTitle'])},
    cardNumber: '{q['cardNumber']}',
    title: {json.dumps(q['title'])},
    category: '{q['category']}',
    difficulty: '{q['difficulty']}',
    instruction: {json.dumps(q['instruction'])},
    loreReason: {json.dumps(q['loreReason'])},
    xpReward: {q['xpReward']},
    proofType: '{q['proofType']}',
    proofPrompt: {json.dumps(q['proofPrompt'])},
{timer_prop}  }}"""
        ts_entries.append(entry)

    prefix = content[:last_bracket_idx].rstrip()
    if not prefix.endswith(","):
        prefix += ","

    new_content = prefix + "\n" + ",\n".join(ts_entries) + "\n];\n"
    QUESTS_DATA_FILE.write_text(new_content, encoding="utf-8")
    print(f"  [OK] Successfully registered {len(quests_to_add)} quests in questsData.ts")

def update_new_arrivals(card_ids):
    """Writes src/data/newArrivals.ts with the latest batch of card IDs."""
    drop_content = f"""export interface NewArrivalsDrop {{
  dropId: string;
  dropDate: string;
  dropTitle: string;
  cardIds: string[];
}}

export const LATEST_DROP: NewArrivalsDrop = {{
  dropId: "drop-{datetime.now().strftime('%Y%m%d%H%M')}",
  dropDate: "{datetime.now().strftime('%Y-%m-%d')}",
  dropTitle: "Celestial New Arrivals",
  cardIds: {json.dumps(card_ids, indent=2)},
}};
"""
    NEW_ARRIVALS_FILE.write_text(drop_content, encoding="utf-8")
    print(f"  [OK] Updated new arrivals drop file with {len(card_ids)} cards.")

def main():
    print("=" * 60)
    print("    FATGOATS TCG - AUTOMATED CARD INGESTION")
    print("=" * 60)

    if not NEW_CARDS_DIR.exists():
        NEW_CARDS_DIR.mkdir(parents=True, exist_ok=True)
        print(f"[!] Created directory: {NEW_CARDS_DIR}")
        print("    Place your new card images here and run this script again.")
        return

    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    CARDS_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)

    # Find image files in NEW CARDS (ignore _archived directory)
    supported_exts = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
    image_files = [
        f for f in NEW_CARDS_DIR.iterdir()
        if f.is_file() and f.suffix.lower() in supported_exts
    ]

    if not image_files:
        print("[!] No new card image files found in 'NEW CARDS/' folder.")
        print("    Simply drop image files (.jpg, .png, .webp) into 'NEW CARDS/' and run again!")
        return

    print(f"[*] Found {len(image_files)} new card image(s) to process:")
    for f in image_files:
        print(f"    - {f.name} ({f.stat().st_size // 1024} KB)")

    current_highest = get_highest_card_number()
    print(f"[*] Current highest card number in collection: #{current_highest:02d}")

    new_cards_list = []
    new_quests_list = []
    new_card_ids = []

    # Sort files to ensure deterministic ordering
    image_files.sort(key=lambda p: p.name)

    for idx, img_path in enumerate(image_files):
        stem = img_path.stem
        next_num = current_highest + 1 + idx
        num_str = f"{next_num:02d}"

        # Match with preset or generate
        matched_preset = None
        for key, val in KNOWN_PRESETS.items():
            if key in stem:
                matched_preset = val
                break

        if matched_preset:
            meta = matched_preset
            # If the cleanName already had a number, use that or adjust
            base_filename = f"{meta['cleanName']}.png"
            base_thumbname = f"{meta['cleanName']}.webp"
            # Extract card number from cleanName if present
            m = re.match(r"^(\d+)\s*-", meta["cleanName"])
            if m:
                card_number = m.group(1)
            else:
                card_number = num_str
        else:
            meta = generate_default_card_metadata(next_num, stem)
            base_filename = f"{meta['cleanName']}.png"
            base_thumbname = f"{meta['cleanName']}.webp"
            card_number = num_str

        card_id = f"fg-{card_number}"
        new_card_ids.append(card_id)

        dest_png = CARDS_DIR / base_filename
        dest_thumb = THUMB_DIR / base_thumbname

        print(f"\nProcessing [{idx+1}/{len(image_files)}]: {img_path.name} -> {base_filename}")
        process_image(img_path, dest_png, dest_thumb)

        new_cards_list.append({
            "id": card_id,
            "cardNumber": card_number,
            "fileName": base_filename,
            "thumbName": base_thumbname,
            "title": meta["title"],
            "subtitle": meta["subtitle"],
            "character": meta["character"],
            "rarity": meta["rarity"],
            "element": meta["element"],
            "hp": meta["hp"],
            "attack": meta["attack"],
            "defense": meta["defense"],
            "speed": meta["speed"],
            "abilityName": meta["abilityName"],
            "abilityDesc": meta["abilityDesc"],
            "flavorText": meta["flavorText"],
        })

        new_quests_list.append({
            "id": f"q-{card_number}",
            "cardId": card_id,
            "cardTitle": f"{meta['title']} {meta['subtitle']}".strip(),
            "cardNumber": card_number,
            "title": meta["questTitle"],
            "category": meta["questCategory"],
            "difficulty": meta["questDifficulty"],
            "instruction": meta["questInstruction"],
            "loreReason": meta["questLore"],
            "xpReward": meta["xpReward"],
            "proofType": meta["questProofType"],
            "proofPrompt": meta["questProofPrompt"],
            "timerDuration": meta.get("timerDuration"),
        })

        # Move original file to _archived folder
        archive_dest = ARCHIVE_DIR / img_path.name
        # If already exists in archive, overwrite
        if archive_dest.exists():
            archive_dest.unlink()
        shutil.move(str(img_path), str(archive_dest))
        print(f"  [>] Moved original to: {archive_dest.relative_to(PROJECT_ROOT)}")

    print("\n" + "-" * 50)
    print("Updating project data files...")
    update_cards_data(new_cards_list)
    update_quests_data(new_quests_list)
    update_new_arrivals(new_card_ids)

    print("\n" + "=" * 60)
    print("  [SUCCESS] All new cards have been imported and registered!")
    print(f"  Processed {len(new_cards_list)} cards successfully.")
    print("=" * 60)

if __name__ == "__main__":
    main()
