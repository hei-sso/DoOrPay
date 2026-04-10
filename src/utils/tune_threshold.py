"""
tune_threshold.py
test_pairs.json을 읽어 최적 임계치를 찾고 결과를 출력
"""

import json


RESULT_JSON = "src/utils/test_pairs.json"


def compute_metrics(pairs, threshold):
    tp = fp = fn = tn = 0
    for p in pairs:
        predicted_dup = p["distance"] <= threshold
        actual_dup    = p["label"] == "duplicate"

        if actual_dup and predicted_dup:
            tp += 1
        elif not actual_dup and predicted_dup:
            fp += 1
        elif actual_dup and not predicted_dup:
            fn += 1
        else:
            tn += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall    = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    f1        = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn,
            "precision": precision, "recall": recall, "f1": f1}


def main():
    with open(RESULT_JSON, encoding="utf-8") as f:
        pairs = json.load(f)

    print(f"총 {len(pairs)}쌍 로드 완료")
    print(f"  중복: {sum(1 for p in pairs if p['label'] == 'duplicate')}쌍")
    print(f"  비중복: {sum(1 for p in pairs if p['label'] == 'unique')}쌍\n")

    # distance 분포 출력
    dup_dists  = [p["distance"] for p in pairs if p["label"] == "duplicate"]
    diff_dists = [p["distance"] for p in pairs if p["label"] == "unique"]
    print(f"중복 쌍  distance: min={min(dup_dists)}  max={max(dup_dists)}  avg={sum(dup_dists)/len(dup_dists):.1f}")
    print(f"비중복 쌍 distance: min={min(diff_dists)}  max={max(diff_dists)}  avg={sum(diff_dists)/len(diff_dists):.1f}\n")

    # 임계치별 성능 계산
    print(f"{'임계치':>5} | {'정밀도':>6} | {'재현율':>6} | {'F1':>6} | {'TP':>3} {'FP':>3} {'FN':>3} {'TN':>3}")
    print("-" * 55)

    best_f1       = -1
    best_threshold = 10
    best_metrics  = {}

    for threshold in range(0, 33):
        m = compute_metrics(pairs, threshold)
        marker = " ◀" if m["f1"] > best_f1 else ""

        if m["f1"] > best_f1:
            best_f1        = m["f1"]
            best_threshold = threshold
            best_metrics   = m

        print(f"  {threshold:>3}  | {m['precision']:>5.1%} | {m['recall']:>5.1%} | {m['f1']:>5.1%} "
              f"| {m['tp']:>3} {m['fp']:>3} {m['fn']:>3} {m['tn']:>3}{marker}")

    print("\n" + "=" * 55)
    print(f"최적 임계치: {best_threshold}")
    print(f"  정밀도: {best_metrics['precision']:.1%}")
    print(f"  재현율: {best_metrics['recall']:.1%}")
    print(f"  F1    : {best_metrics['f1']:.1%}")
    print(f"  TP={best_metrics['tp']} FP={best_metrics['fp']} FN={best_metrics['fn']} TN={best_metrics['tn']}")
    print("=" * 55)

    # FP/FN 케이스 상세 출력
    print(f"\n[FP - 비중복인데 중복으로 판정된 케이스] (임계치={best_threshold})")
    fp_cases = [p for p in pairs if p["label"] == "unique" and p["distance"] <= best_threshold]
    if fp_cases:
        for p in fp_cases:
            print(f"  {p['pair_id']} | distance={p['distance']} | scenario={p['scenario']}")
    else:
        print("  없음")

    print(f"\n[FN - 중복인데 통과된 케이스] (임계치={best_threshold})")
    fn_cases = [p for p in pairs if p["label"] == "duplicate" and p["distance"] > best_threshold]
    if fn_cases:
        for p in fn_cases:
            print(f"  {p['pair_id']} | distance={p['distance']} | scenario={p['scenario']}")
    else:
        print("  없음")

    print(f"\n→ hamming.py의 threshold 기본값을 {best_threshold}으로 설정하세요.")


if __name__ == "__main__":
    main()