"""
generate_test_data.py
중복 25쌍 + 비중복 25쌍 테스트 데이터 자동 생성
"""

import json
import os
from PIL import Image, ImageEnhance
import imagehash


# ── 설정 ──────────────────────────────────────────────
SEED_IMAGES = {
    "workout": "src/utils/workout.webp",
    "food":    "src/utils/fooddiet.jpeg",
}
OUTPUT_DIR = "src/utils/test_images"
RESULT_JSON = "src/utils/test_pairs.json"
# ──────────────────────────────────────────────────────


def compute_phash(img: Image.Image) -> str:
    return str(imagehash.phash(img))


def save(img: Image.Image, name: str) -> str:
    path = os.path.join(OUTPUT_DIR, name)
    img.convert("RGB").save(path, "JPEG", quality=92)
    return path


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    workout = Image.open(SEED_IMAGES["workout"]).convert("RGB")
    food    = Image.open(SEED_IMAGES["food"]).convert("RGB")
    ww, wh = workout.size
    fw, fh = food.size

    dup_pairs  = []
    diff_pairs = []

    # ── 중복 25쌍 ─────────────────────────────────────
    print("중복 쌍 생성 중...")

    # workout 기반 변형 12가지
    workout_variants = [
        ("exact_copy",      workout.copy()),
        ("brightness_up",   ImageEnhance.Brightness(workout).enhance(1.15)),
        ("brightness_down", ImageEnhance.Brightness(workout).enhance(0.85)),
        ("crop_5pct",       workout.crop((int(ww*.05), int(wh*.05), int(ww*.95), int(wh*.95)))),
        ("crop_10pct",      workout.crop((int(ww*.10), int(wh*.10), int(ww*.90), int(wh*.90)))),
        ("contrast_up",     ImageEnhance.Contrast(workout).enhance(1.2)),
        ("contrast_down",   ImageEnhance.Contrast(workout).enhance(0.8)),
        ("screenshot",      workout.resize((int(ww*.5), int(wh*.5)), Image.LANCZOS).resize((ww, wh), Image.LANCZOS)),
        ("saturation_up",   ImageEnhance.Color(workout).enhance(1.3)),
        ("saturation_down", ImageEnhance.Color(workout).enhance(0.7)),
        ("sharpness_up",    ImageEnhance.Sharpness(workout).enhance(2.0)),
        ("sharpness_down",  ImageEnhance.Sharpness(workout).enhance(0.3)),
    ]

    # food 기반 변형 13가지
    food_variants = [
        ("exact_copy",      food.copy()),
        ("brightness_up",   ImageEnhance.Brightness(food).enhance(1.15)),
        ("brightness_down", ImageEnhance.Brightness(food).enhance(0.85)),
        ("crop_5pct",       food.crop((int(fw*.05), int(fh*.05), int(fw*.95), int(fh*.95)))),
        ("crop_10pct",      food.crop((int(fw*.10), int(fh*.10), int(fw*.90), int(fh*.90)))),
        ("contrast_up",     ImageEnhance.Contrast(food).enhance(1.2)),
        ("contrast_down",   ImageEnhance.Contrast(food).enhance(0.8)),
        ("screenshot",      food.resize((int(fw*.5), int(fh*.5)), Image.LANCZOS).resize((fw, fh), Image.LANCZOS)),
        ("saturation_up",   ImageEnhance.Color(food).enhance(1.3)),
        ("saturation_down", ImageEnhance.Color(food).enhance(0.7)),
        ("sharpness_up",    ImageEnhance.Sharpness(food).enhance(2.0)),
        ("sharpness_down",  ImageEnhance.Sharpness(food).enhance(0.3)),
        ("crop_3pct",       food.crop((int(fw*.03), int(fh*.03), int(fw*.97), int(fh*.97)))),
    ]

    # workout 원본 저장
    workout_orig_path = save(workout, "workout_original.jpg")
    workout_orig_hash = compute_phash(workout)

    for tag, variant in workout_variants:
        var_path = save(variant, f"workout_{tag}.jpg")
        var_hash = compute_phash(variant)
        dist = int(imagehash.hex_to_hash(workout_orig_hash) - imagehash.hex_to_hash(var_hash))
        dup_pairs.append({
            "pair_id": f"dup_workout_{tag}",
            "image_a": workout_orig_path,
            "image_b": var_path,
            "hash_a": workout_orig_hash,
            "hash_b": var_hash,
            "distance": dist,
            "label": "duplicate",
            "scenario": tag,
        })
        print(f"  [중복] workout_{tag} → distance: {dist}")

    # food 원본 저장
    food_orig_path = save(food, "food_original.jpg")
    food_orig_hash = compute_phash(food)

    for tag, variant in food_variants:
        var_path = save(variant, f"food_{tag}.jpg")
        var_hash = compute_phash(variant)
        dist = int(imagehash.hex_to_hash(food_orig_hash) - imagehash.hex_to_hash(var_hash))
        dup_pairs.append({
            "pair_id": f"dup_food_{tag}",
            "image_a": food_orig_path,
            "image_b": var_path,
            "hash_a": food_orig_hash,
            "hash_b": var_hash,
            "distance": dist,
            "label": "duplicate",
            "scenario": tag,
        })
        print(f"  [중복] food_{tag} → distance: {dist}")

    dup_pairs = dup_pairs[:25]

    # ── 비중복 25쌍 ───────────────────────────────────
    print("\n비중복 쌍 생성 중...")

    workout_transforms = [
        workout.crop((0,       0,       ww//2, wh)),
        workout.crop((ww//2,   0,       ww,    wh)),
        workout.crop((0,       0,       ww,    wh//2)),
        workout.crop((0,       wh//2,   ww,    wh)),
        workout.rotate(5,  expand=True),
        workout.rotate(-5, expand=True),
        workout.rotate(10, expand=True),
        ImageEnhance.Color(workout).enhance(0.0),
        workout.crop((int(ww*.2), int(wh*.2), int(ww*.8), int(wh*.8))),
        workout.crop((int(ww*.1), 0,          int(ww*.9), wh//2)),
        workout.transpose(Image.FLIP_LEFT_RIGHT),
        workout.resize((ww//3, wh//3), Image.LANCZOS).resize((ww, wh), Image.LANCZOS),
        ImageEnhance.Brightness(workout).enhance(0.3),
    ]

    food_transforms = [
        food.crop((0,       0,       fw//2, fh)),
        food.crop((fw//2,   0,       fw,    fh)),
        food.crop((0,       0,       fw,    fh//2)),
        food.crop((0,       fh//2,   fw,    fh)),
        food.rotate(5,  expand=True),
        food.rotate(-5, expand=True),
        food.rotate(10, expand=True),
        ImageEnhance.Color(food).enhance(0.0),
        food.crop((int(fw*.2), int(fh*.2), int(fw*.8), int(fh*.8))),
        food.crop((int(fw*.1), 0,          int(fw*.9), fh//2)),
        food.transpose(Image.FLIP_LEFT_RIGHT),
        food.resize((fw//3, fh//3), Image.LANCZOS).resize((fw, fh), Image.LANCZOS),
        ImageEnhance.Brightness(food).enhance(0.3),
    ]

    # 운동 vs 식단 변형 (13쌍)
    for i in range(13):
        ta = workout_transforms[i]
        tb = food_transforms[i]
        pa = save(ta, f"diff_workout_{i:02d}.jpg")
        pb = save(tb, f"diff_food_{i:02d}.jpg")
        ha = compute_phash(ta)
        hb = compute_phash(tb)
        dist = int(imagehash.hex_to_hash(ha) - imagehash.hex_to_hash(hb))
        diff_pairs.append({
            "pair_id": f"diff_{i:03d}",
            "image_a": pa,
            "image_b": pb,
            "hash_a": ha,
            "hash_b": hb,
            "distance": dist,
            "label": "unique",
            "scenario": "workout_vs_food",
        })
        print(f"  [비중복] pair_{i:03d} → distance: {dist}")

    # 운동 변형끼리 (같은 장소 다른 날, 6쌍)
    for i in range(6):
        ta = workout_transforms[i]
        tb = workout_transforms[i + 6]
        pa = save(ta, f"diff_workout_same_a_{i}.jpg")
        pb = save(tb, f"diff_workout_same_b_{i}.jpg")
        ha = compute_phash(ta)
        hb = compute_phash(tb)
        dist = int(imagehash.hex_to_hash(ha) - imagehash.hex_to_hash(hb))
        diff_pairs.append({
            "pair_id": f"diff_same_gym_{i:03d}",
            "image_a": pa,
            "image_b": pb,
            "hash_a": ha,
            "hash_b": hb,
            "distance": dist,
            "label": "unique",
            "scenario": "same_place_different_day",
        })
        print(f"  [비중복] same_gym_{i} → distance: {dist}")

    # 식단 변형끼리 (비슷한 메뉴 다른 날, 6쌍)
    for i in range(6):
        ta = food_transforms[i]
        tb = food_transforms[i + 6]
        pa = save(ta, f"diff_food_same_a_{i}.jpg")
        pb = save(tb, f"diff_food_same_b_{i}.jpg")
        ha = compute_phash(ta)
        hb = compute_phash(tb)
        dist = int(imagehash.hex_to_hash(ha) - imagehash.hex_to_hash(hb))
        diff_pairs.append({
            "pair_id": f"diff_same_food_{i:03d}",
            "image_a": pa,
            "image_b": pb,
            "hash_a": ha,
            "hash_b": hb,
            "distance": dist,
            "label": "unique",
            "scenario": "same_menu_different_day",
        })
        print(f"  [비중복] same_food_{i} → distance: {dist}")

    diff_pairs = diff_pairs[:25]

    # ── 결과 저장 ─────────────────────────────────────
    all_pairs = dup_pairs + diff_pairs

    with open(RESULT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_pairs, f, ensure_ascii=False, indent=2)

    print(f"\n완료!")
    print(f"  중복 쌍: {len(dup_pairs)}개")
    print(f"  비중복 쌍: {len(diff_pairs)}개")
    print(f"  전체: {len(all_pairs)}개")
    print(f"  결과 저장: {RESULT_JSON}")


if __name__ == "__main__":
    main()