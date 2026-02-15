#!/usr/bin/env python3

import json
import re
import subprocess
import sys
from pathlib import Path


PDF_URL = "https://edukacja.um.warszawa.pl/documents/66399/127344221/Minimalna%2Bliczba%2Bpunkt%C3%B3w_zakwalifikowani_2025.pdf"
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PDF_PATH = DATA_DIR / "minimalne-punkty-2025.pdf"
TXT_PATH = DATA_DIR / "source.txt"
JSON_PATH = DATA_DIR / "schools-2025.json"


def run(command: list[str]) -> None:
  result = subprocess.run(command, check=False, capture_output=True, text=True)
  if result.returncode != 0:
    print(result.stdout)
    print(result.stderr)
    raise RuntimeError(f"Command failed: {' '.join(command)}")


def parse_rows(text: str) -> list[dict[str, object]]:
  rows = []
  for raw in text.splitlines():
    line = raw.replace("\x0c", "").strip()
    if not line or line.startswith("Dzielnica"):
      continue

    parts = re.split(r"\s{2,}", line)
    if len(parts) < 5:
      continue

    points_raw = parts[-1].strip()
    if not re.fullmatch(r"(?:\d+(?:\.\d+)?|n\.d\.)", points_raw):
      continue

    district = parts[0].strip()
    symbol = parts[-3].strip()
    profile = parts[-2].strip()
    school = " ".join(part.strip() for part in parts[1:-3]).strip()
    points = None if points_raw == "n.d." else float(points_raw)

    rows.append(
      {
        "district": district,
        "school": school,
        "symbol": symbol,
        "profile": profile,
        "minPoints": points,
        "minPointsRaw": points_raw,
      }
    )
  return rows


def main() -> int:
  DATA_DIR.mkdir(parents=True, exist_ok=True)

  print("Downloading PDF...")
  run(["curl", "-Lk", "-o", str(PDF_PATH), PDF_URL])

  print("Extracting text...")
  run(["pdftotext", "-layout", "-nopgbrk", str(PDF_PATH), str(TXT_PATH)])

  print("Parsing rows...")
  rows = parse_rows(TXT_PATH.read_text(encoding="utf-8", errors="ignore"))
  JSON_PATH.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
  print(f"Saved {len(rows)} rows to {JSON_PATH}")
  return 0


if __name__ == "__main__":
  try:
    raise SystemExit(main())
  except Exception as error:  # pragma: no cover
    print(error, file=sys.stderr)
    raise SystemExit(1)
