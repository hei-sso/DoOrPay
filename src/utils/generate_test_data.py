"""
generate_test_data.py
중복 25쌍 + 비중복 25쌍 테스트 데이터 자동 생성
"""

import json
import os
from PIL import Image, ImageEnhance, ImageFilter
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


def make_duplicate_variants(img: Image.Image, prefix: str) -> list:
    """원본 1장으로 치팅 시나리오 5가지 변형 생성"""
    variants = []

    # 1. 동일 재업로드
    variants.append(("exact_copy", img.copy()))

    # 2. 밝기 살짝 조정 (필터 효과)
    variants.append(("brightness", ImageEnhance.Brightness(img).enhance(1.15)))

    # 3. 살짝 크롭 (테두리 5% 제거)
    w, h = img.size
    variants.append(("crop", img.crop((int(w*0.05), int(h*0.05), int(w*0.95), int(h*0.95)))))

    # 4. 대비 조정 (보정 앱 효과)
    variants.append(("contrast", ImageEnhance.Contrast(img).enhance(1.2)))

    # 5. 리사이즈 후 원본 크기로 복원 (스크린샷 재촬영 시뮬레이션)
    small = img.resize((int(w*0.5), int(h*0.5)), Image.LANCZOS)
    variants.append(("screenshot", small.resize((w, h), Image.LANCZOS)))

    saved = []
    for tag, v in variants:
        path = save(v, f"{prefix}_{tag}.jpg")
        saved.append((tag, path))
    return saved


def make_different_pairs(imgs: list) -> list:
    """서로 다른 카테고리 이미지 조합으로 비중복 쌍 생성"""
    pairs = []
    base_a, base_b = imgs[0], imgs[1]
    w_a, h_a = base_a.size
    w_b, h_b = base_b.size

    transforms_a = [
        base_a.crop((0, 0, w_a//2, h_a)),
        base_a.crop((w_a//2, 0, w_a, h_a)),
        base_a.crop((0, 0, w_a, h_a//2)),
        base_a.rotate(5),
        ImageEnhance.Color(base_a).enhance(0.5),
    ]
    transforms_b = [
        base_b.crop((0, 0, w_b//2, h_b)),
        base_b.crop((w_b//2, 0, w_b, h_b)),
        base_b.crop((0, 0, w_b, h_b//2)),
        base_b.rotate(-5),
        ImageEnhance.Color(base_b).enhance(0.5),
    ]

    tags = ["half_left", "half_right", "top_half", "rotated", "grayscale"]

    for i, (ta, tb) in enumerate(zip(transforms_a, transforms_b)):
        path_a = save(ta, f"workout_diff_{tags[i]}.jpg")
        path_b = save(tb, f"food_diff_{tags[i]}.jpg")
        pairs.append((path_a, path_b))

    # 추가: 운동 변형 vs 식단 변형 크로스 조합
    for i in range(5):
        ta = transforms_a[i % len(transforms_a)]
        tb = transforms_b[(i + 2) % len(transforms_b)]
        path_a = save(ta, f"workout_cross_{i}.jpg")
        path_b = save(tb, f"food_cross_{i}.jpg")
        pairs.append((path_a, path_b))

    # 추가: 운동 원본 변형끼리 조합 (다른 날 같은 장소 시뮬레이션)
    for i in range(5):
        ta = transforms_a[i % len(transforms_a)]
        tb = transforms_a[(i + 3) % len(transforms_a)]
        path_a = save(ta, f"workout_sameplace_a_{i}.jpg")
        path_b = save(tb, f"workout_sameplace_b_{i}.jpg")
        pairs.append((path_a, path_b))

    # 추가: 식단 원본 변형끼리 조합
    for i in range(5):
        ta = transforms_b[i % len(transforms_b)]
        tb = transforms_b[(i + 2) % len(transforms_b)]
        path_a = save(ta, f"food_sameplace_a_{i}.jpg")
        path_b = save(tb, f"food_sameplace_b_{i}.jpg")
        pairs.append((path_a, path_b))

    # 추가: 운동 원본 vs 식단 원본
    path_a = save(base_a, "workout_original.jpg")
    path_b = save(base_b, "food_original.jpg")
    pairs.append((path_a, path_b))

    return pairs[:25]


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    pairs = []

    # ── 중복 25쌍 ─────────────────────────────────────
    print("중복 쌍 생성 중...")
    for label, seed_path in SEED_IMAGES.items():
        img = Image.open(seed_path).convert("RGB")
        original_path = save(img, f"{label}_original_seed.jpg")
        original_hash = compute_phash(img)

        variants = make_duplicate_variants(img, label)
        for tag, var_path in variants:
            var_img = Image.open(var_path)
            var_hash = compute_phash(var_img)
            dist = imagehash.hex_to_hash(original_hash) - imagehash.hex_to_hash(var_hash)
            pairs.append({
                "pair_id": f"dup_{label}_{tag}",
                "image_a": original_path,
                "image_b": var_path,
                "hash_a": original_hash,
                "hash_b": var_hash,
                "distance": dist,
                "label": "duplicate",
                "scenario": tag,
            })
            print(f"  [중복] {label}_{tag} → distance: {dist}")

    # 운동+식단 교차 중복 (동일 사진 재업로드 시뮬레이션 추가)
    for label, seed_path in SEED_IMAGES.items():
        img = Image.open(seed_path).convert("RGB")
        h = compute_phash(img)
        path = save(img, f"{label}_reupload.jpg")
        pairs.append({
            "pair_id": f"dup_{label}_reupload_2",
            "image_a": path,
            "image_b": path,
            "hash_a": h,
            "hash_b": h,
            "distance": 0,
            "label": "duplicate",
            "scenario": "exact_reupload",
        })

    dup_pairs = [p for p in pairs if p["label"] == "duplicate"][:25]

    # ── 비중복 25쌍 ───────────────────────────────────
    print("\n비중복 쌍 생성 중...")
    imgs = [Image.open(p).convert("RGB") for p in SEED_IMAGES.values()]
    diff_path_pairs = make_different_pairs(imgs)

    diff_pairs = []
    for i, (pa, pb) in enumerate(diff_path_pairs):
        img_a = Image.open(pa)
        img_b = Image.open(pb)
        ha = compute_phash(img_a)
        hb = compute_phash(img_b)
        dist = imagehash.hex_to_hash(ha) - imagehash.hex_to_hash(hb)
        diff_pairs.append({
            "pair_id": f"diff_{i:03d}",
            "image_a": pa,
            "image_b": pb,
            "hash_a": ha,
            "hash_b": hb,
            "distance": dist,
            "label": "unique",
            "scenario": "different_images",
        })
        print(f"  [비중복] pair_{i:03d} → distance: {dist}")

    # ── 결과 저장 ─────────────────────────────────────
    all_pairs = dup_pairs + diff_pairs[:25]

    with open(RESULT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_pairs, f, ensure_ascii=False, indent=2)

    print(f"\n완료!")
    print(f"  중복 쌍: {len(dup_pairs)}개")
    print(f"  비중복 쌍: {len(diff_pairs[:25])}개")
    print(f"  결과 저장: {RESULT_JSON}")


if __name__ == "__main__":
    main()