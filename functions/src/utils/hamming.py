import imagehash
from PIL import Image


def compute_phash(image_path: str) -> str:
    """이미지 파일 경로를 받아 pHash(64비트 hex)를 반환"""
    img = Image.open(image_path)
    return str(imagehash.phash(img))


def hamming_distance(hash_a: str, hash_b: str) -> int:
    """두 pHash 사이의 Hamming Distance 계산 (XOR 비트카운트)"""
    int_a = int(hash_a, 16)
    int_b = int(hash_b, 16)
    xor = int_a ^ int_b
    return bin(xor).count('1')


def is_duplicate(hash_a: str, hash_b: str, threshold: int = 10) -> bool:
    """distance <= threshold 이면 중복으로 판정"""
    return hamming_distance(hash_a, hash_b) <= threshold


def check_user_duplicates(new_hash: str, user_hashes: list, threshold: int = 10) -> list:
    """새 이미지 hash를 사용자의 기존 hash 목록과 비교"""
    results = []
    for old_hash in user_hashes:
        dist = hamming_distance(new_hash, old_hash)
        results.append({
            "hash": old_hash,
            "distance": dist,
            "is_duplicate": dist <= threshold
        })
    return sorted(results, key=lambda x: x["distance"])


# Node.js에서 child_process로 호출할 때 사용
if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print(json.dumps({"error": "이미지 경로를 인자로 전달해주세요"}))
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        phash = compute_phash(image_path)
        print(json.dumps({"phash": phash}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)