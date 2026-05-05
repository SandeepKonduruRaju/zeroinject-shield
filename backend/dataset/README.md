# Dataset Files

Place your dataset files in this folder (`backend/dataset/`).

## JailbreakBench

Download from: https://github.com/JailbreakBench/jailbreakbench

Save as: `backend/dataset/jailbreakbench.json`

Expected format (array of objects or strings):
```json
[
  {"goal": "attack prompt here"},
  ...
]
```

## Qualifire

Download from: https://huggingface.co/datasets/Qualifire/prompt-injection

Save as: `backend/dataset/qualifire.json`

Expected format:
```json
[
  {"prompt": "...", "label": "injection"},
  {"prompt": "...", "label": "legitimate"},
  ...
]
```

## Fallback

If no files are found, the app uses 25 built-in hardcoded samples automatically.
The app will still run — datasets just improve demo benchmark accuracy.
