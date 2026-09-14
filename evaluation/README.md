# OCR Evaluation

This directory is for measuring the accuracy of the project's image OCR pipeline.

## Dataset layout

Place at least 50 image samples in `evaluation/samples/` and the corresponding ground-truth text files in `evaluation/ground_truth/` using the same base filename:

```text
evaluation/
├── samples/
│   ├── sample01.png
│   ├── sample02.jpg
│   └── ...
├── ground_truth/
│   ├── sample01.txt
│   ├── sample02.txt
│   └── ...
└── evaluate_ocr.py
```

## Metrics

The evaluator reports Character Error Rate (CER), Word Error Rate (WER), and an accuracy estimate derived from CER (`100 * (1 - CER)`). The reported number should only be used on the supplied benchmark dataset and should not be presented as a universal OCR accuracy.

## Important

The application currently uses Tesseract.js for image files and PDF.js text extraction for PDFs. This benchmark is intentionally for the Tesseract image-OCR path only.
