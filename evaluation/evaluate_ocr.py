"""Evaluate OCR output against ground-truth text.

Usage:
    python evaluation/evaluate_ocr.py

The script expects matching image/text filenames under evaluation/samples
and evaluation/ground_truth. It intentionally does not run Tesseract itself;
the benchmark should use OCR text produced by the application's existing
Tesseract.js pipeline. Put those outputs in evaluation/ocr_output/ before
running the script.
"""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
GROUND_TRUTH = ROOT / "ground_truth"
OCR_OUTPUT = ROOT / "ocr_output"


def normalize(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n+", "\n", text)
    return text.strip().lower()


def levenshtein(a: str, b: str) -> int:
    if len(a) < len(b):
        a, b = b, a
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        for j, cb in enumerate(b, 1):
            current.append(min(
                current[-1] + 1,
                previous[j] + 1,
                previous[j - 1] + (ca != cb),
            ))
        previous = current
    return previous[-1]


def error_rate(reference: str, hypothesis: str) -> float:
    if not reference:
        return 0.0 if not hypothesis else 1.0
    return levenshtein(reference, hypothesis) / len(reference)


def main() -> None:
    if not GROUND_TRUTH.exists() or not OCR_OUTPUT.exists():
        raise SystemExit(
            "Create evaluation/ground_truth and evaluation/ocr_output, "
            "then add matching .txt files before running the benchmark."
        )

    references = {p.stem: p for p in GROUND_TRUTH.glob("*.txt")}
    hypotheses = {p.stem: p for p in OCR_OUTPUT.glob("*.txt")}
    names = sorted(references.keys() & hypotheses.keys())

    if not names:
        raise SystemExit("No matching ground-truth/OCR output pairs found.")

    total_chars = total_char_errors = 0
    total_words = total_word_errors = 0

    for name in names:
        reference = normalize(references[name].read_text(encoding="utf-8"))
        hypothesis = normalize(hypotheses[name].read_text(encoding="utf-8"))

        char_errors = levenshtein(reference, hypothesis)
        reference_words = reference.split()
        hypothesis_words = hypothesis.split()
        word_errors = levenshtein(" ".join(reference_words), " ".join(hypothesis_words))

        total_chars += len(reference)
        total_char_errors += char_errors
        total_words += len(reference_words)
        total_word_errors += word_errors

    cer = total_char_errors / total_chars if total_chars else 0.0
    wer = total_word_errors / total_words if total_words else 0.0
    accuracy = max(0.0, 1.0 - cer) * 100

    print("OCR Evaluation")
    print("--------------")
    print(f"Matched samples: {len(names)}")
    print(f"Character Error Rate (CER): {cer:.2%}")
    print(f"Word Error Rate (WER):      {wer:.2%}")
    print(f"OCR accuracy (1 - CER):     {accuracy:.2f}%")

    if len(names) < 50:
        print(f"WARNING: benchmark contains only {len(names)} samples; use at least 50 for the resume claim.")


if __name__ == "__main__":
    main()
