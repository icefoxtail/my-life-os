#!/usr/bin/env python3
"""
Split per-part Clova voice MP3 files into individual voice assets.

Expected layout:
  assets/voice/source/parts/{part}.mp3
  assets/voice/source/parts/{part}_keys.txt
  assets/voice/source/parts/{part}_script.txt  (optional, validated when present)

Usage:
  python tools/split_voice_parts.py --scan
  python tools/split_voice_parts.py --part 08_parking
  python tools/split_voice_parts.py --all
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCAL_DEPS = ROOT / ".codex_deps" / "python"
if LOCAL_DEPS.exists():
    sys.path.insert(0, str(LOCAL_DEPS))

try:
    from pydub import AudioSegment
    from pydub.silence import detect_nonsilent
except ImportError:
    AudioSegment = None
    detect_nonsilent = None


SOURCE_DIR = ROOT / "assets" / "voice" / "source" / "parts"
OUTPUT_DIR = ROOT / "assets" / "voice" / "games"
MANIFEST_PATH = ROOT / "assets" / "voice" / "voice_manifest.json"
REPORT_PATH = ROOT / "assets" / "voice" / "split_report.json"

MIN_SILENCE_LEN = 650
SILENCE_THRESH = -40
KEEP_SILENCE = 120
EXPECTED_TOTAL = 307
PART_PARAM_OVERRIDES = {
    "01_common_index": {
        "min_silence_len": 675,
        "silence_thresh": -38,
    },
}
PART_SPLIT_PARAMS = {
    "02_memory": (650, -40),
    "03_number": (650, -42),
    "04_block": (650, -46),
    "05_letter": (675, -42),
    "06_color": (650, -50),
    "07_car": (650, -56),
    "08_parking": (675, -38),
    "09_construction_vehicle_names": (300, -60),
    "10_construction_vehicle_sounds": (600, -56),
    "11_construction": (750, -30),
    "12_sequence": (600, -56),
    "13_paint": (675, -36),
    "14_abc_korean": (700, -36),
    "15_cat": (675, -42),
    "16_voice_zone": (650, -44),
    "17_karaoke_guide": (1000, -26),
}
EXPECTED_PARTS = {
    "01_common_index": 19,
    "02_memory": 7,
    "03_number": 14,
    "04_block": 26,
    "05_letter": 10,
    "06_color": 10,
    "07_car": 9,
    "08_parking": 2,
    "09_construction_vehicle_names": 27,
    "10_construction_vehicle_sounds": 27,
    "11_construction": 11,
    "12_sequence": 50,
    "13_paint": 26,
    "14_abc_korean": 34,
    "15_cat": 8,
    "16_voice_zone": 8,
    "17_karaoke_guide": 19,
}
FORBIDDEN_PARTS = {
    "08_karaoke_guide",
    "09B_construction_vehicle_names",
    "09C_construction_vehicle_sounds",
}


@dataclass
class PartData:
    name: str
    keys_path: Path
    script_path: Path
    mp3_path: Path
    keys: list[str]
    script_blocks: list[str]


def voice_id_to_filename(voice_id: str) -> str:
    safe = voice_id.strip().lower().replace(".", "-")
    safe = re.sub(r"[^a-z0-9-]", "-", safe)
    safe = re.sub(r"-+", "-", safe).strip("-")
    if not safe:
        raise ValueError(f"Invalid voice id: {voice_id}")
    return f"{safe}.mp3"


def validate_voice_id(voice_id: str) -> bool:
    return bool(re.match(r"^[a-z][A-Za-z0-9]*(\.[a-z][A-Za-z0-9]*)+$", voice_id))


def read_keys(path: Path) -> list[str]:
    return [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def read_script_blocks(path: Path) -> list[str]:
    if not path.exists():
        return []
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    return [block.strip() for block in re.split(r"\n\s*\n", raw) if block.strip()]


def discover_parts() -> list[str]:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    parts = sorted(path.name[:-len("_keys.txt")] for path in SOURCE_DIR.glob("*_keys.txt"))
    return parts


def load_part(part: str) -> PartData:
    keys_path = SOURCE_DIR / f"{part}_keys.txt"
    script_path = SOURCE_DIR / f"{part}_script.txt"
    return PartData(
        name=part,
        keys_path=keys_path,
        script_path=script_path,
        mp3_path=SOURCE_DIR / f"{part}.mp3",
        keys=read_keys(keys_path) if keys_path.exists() else [],
        script_blocks=read_script_blocks(script_path),
    )


def check_part(part: str, verbose: bool = True) -> tuple[bool, list[str]]:
    data = load_part(part)
    errors: list[str] = []
    expected = EXPECTED_PARTS.get(part)
    if part in FORBIDDEN_PARTS:
        errors.append("forbidden obsolete part")
    if not data.keys_path.exists():
        errors.append("missing keys")
    if not data.keys:
        errors.append("empty keys")
    if expected is not None and len(data.keys) != expected:
        errors.append(f"expected {expected} keys, got {len(data.keys)}")
    if data.script_path.exists() and len(data.script_blocks) != len(data.keys):
        errors.append(f"keys/script mismatch {len(data.keys)} != {len(data.script_blocks)}")
    if not data.mp3_path.exists():
        errors.append("missing mp3")
    duplicates = sorted({key for key in data.keys if data.keys.count(key) > 1})
    if duplicates:
        errors.append("duplicate keys: " + ", ".join(duplicates))
    invalid = [key for key in data.keys if not validate_voice_id(key)]
    if invalid:
        errors.append("invalid keys: " + ", ".join(invalid))

    ok = not errors
    if verbose:
        mark = "OK" if ok else "FAIL"
        script_count = len(data.script_blocks) if data.script_path.exists() else "none"
        mp3 = "mp3" if data.mp3_path.exists() else "no-mp3"
        print(f"[{mark}] {part}: keys={len(data.keys)} script={script_count} {mp3}")
        for error in errors:
            print(f"  - {error}")
    return ok, errors


def scan() -> bool:
    parts = discover_parts()
    print(f"parts: {SOURCE_DIR}")
    all_ok = True

    missing_expected = [part for part in EXPECTED_PARTS if part not in parts]
    extra_parts = [part for part in parts if part not in EXPECTED_PARTS]
    forbidden_present = [part for part in parts if part in FORBIDDEN_PARTS]

    if missing_expected:
        all_ok = False
        print("[FAIL] missing expected parts: " + ", ".join(missing_expected))
    if extra_parts:
        all_ok = False
        print("[FAIL] unexpected parts: " + ", ".join(extra_parts))
    if forbidden_present:
        all_ok = False
        print("[FAIL] forbidden parts present: " + ", ".join(forbidden_present))

    seen: dict[str, str] = {}
    total = 0
    for part in parts:
        ok, _ = check_part(part)
        all_ok = all_ok and ok
        data = load_part(part)
        total += len(data.keys)
        for key in data.keys:
            if key in seen:
                print(f"[FAIL] duplicate across parts: {key} in {seen[key]} and {part}")
                all_ok = False
            seen[key] = part

    if total != EXPECTED_TOTAL:
        print(f"[FAIL] total voice ids expected {EXPECTED_TOTAL}, got {total}")
        all_ok = False

    print("")
    print(f"parts count: {len(parts)}")
    print(f"total voice ids: {total}")
    print("scan: OK" if all_ok else "scan: FAIL")
    return all_ok


def require_audio_tools() -> None:
    if AudioSegment is None or detect_nonsilent is None:
        raise RuntimeError("pydub is not installed. Install pydub first.")
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        try:
            import imageio_ffmpeg
            ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            ffmpeg = None
    if not ffmpeg:
        raise RuntimeError("ffmpeg was not found in PATH.")
    AudioSegment.converter = ffmpeg
    AudioSegment.ffmpeg = ffmpeg
    AudioSegment.ffprobe = ffmpeg


def merge_ranges_to_count(ranges: list[list[int]], expected_count: int) -> list[list[int]]:
    merged = [[int(start), int(end)] for start, end in ranges]
    while len(merged) > expected_count:
        gaps = [(merged[index + 1][0] - merged[index][1], index) for index in range(len(merged) - 1)]
        _, index = min(gaps, key=lambda item: item[0])
        merged[index][1] = merged[index + 1][1]
        del merged[index + 1]
    return merged


def get_part_ranges(audio, part: str, expected_count: int) -> tuple[list[list[int]], int, int, str]:
    override = PART_PARAM_OVERRIDES.get(part)
    if override:
        min_silence_len = int(override["min_silence_len"])
        silence_thresh = int(override["silence_thresh"])
    else:
        min_silence_len, silence_thresh = PART_SPLIT_PARAMS.get(part, (MIN_SILENCE_LEN, SILENCE_THRESH))
    ranges = detect_nonsilent(
        audio,
        min_silence_len=min_silence_len,
        silence_thresh=silence_thresh,
        seek_step=10,
    )
    raw_count = len(ranges)
    note = "exact"
    if raw_count > expected_count:
        ranges = merge_ranges_to_count(ranges, expected_count)
        note = f"merged_from_{raw_count}"
    return ranges, min_silence_len, silence_thresh, note


def split_part(part: str) -> tuple[list[tuple[str, str]], dict[str, object]]:
    data = load_part(part)
    ok, errors = check_part(part, verbose=False)
    if not ok:
        raise RuntimeError(f"{part} is not ready: {'; '.join(errors)}")
    require_audio_tools()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\nSplitting {part}...")
    audio = AudioSegment.from_file_using_temporary_files(data.mp3_path)
    expected_count = len(data.keys)
    ranges, min_silence_len, silence_thresh, note = get_part_ranges(audio, part, expected_count)
    print(f"  expected={expected_count} chunks={len(ranges)} ({note})")

    output_files: list[str] = []
    report = {
        "part": part,
        "expected_count": expected_count,
        "chunk_count": len(ranges),
        "min_silence_len": min_silence_len,
        "silence_thresh": silence_thresh,
        "status": "PASS" if len(ranges) == expected_count else "FAIL",
        "note": note,
        "output_files": output_files,
    }

    if len(ranges) != expected_count:
        for index, (start, end) in enumerate(ranges, start=1):
            print(f"  chunk {index:03d}: {end - start}ms")
        return [], report

    voices: list[tuple[str, str]] = []
    for index, (voice_id, (start, end)) in enumerate(zip(data.keys, ranges), start=1):
        filename = voice_id_to_filename(voice_id)
        output_path = OUTPUT_DIR / filename
        clip_start = max(0, start - KEEP_SILENCE)
        clip_end = min(len(audio), end + KEEP_SILENCE)
        padded = AudioSegment.silent(duration=80) + audio[clip_start:clip_end] + AudioSegment.silent(duration=120)
        padded.export(output_path, format="mp3", bitrate="128k")
        file_ref = f"./assets/voice/games/{filename}"
        voices.append((voice_id, file_ref))
        output_files.append(file_ref)
        print(f"  {index:03d}. {voice_id} -> {filename}")
    return voices, report


def write_results(voices: list[tuple[str, str]], reports: list[dict[str, object]]) -> None:
    manifest = {
        "version": "sihyeon-voice-v1",
        "format": "mp3",
        "basePath": "./assets/voice/games/",
        "voices": {voice_id: file_ref for voice_id, file_ref in voices},
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT_PATH.write_text(json.dumps(reports, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nmanifest written: {MANIFEST_PATH}")
    print(f"report written: {REPORT_PATH}")
    print(f"manifest voices: {len(manifest['voices'])}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scan", action="store_true")
    parser.add_argument("--part")
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()

    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.scan:
        return 0 if scan() else 1

    if args.part:
        voices, report = split_part(args.part)
        if report["status"] != "PASS":
            write_results([], [report])
            return 1
        write_results(voices, [report])
        return 0

    if args.all:
        if not scan():
            return 1
        all_voices: list[tuple[str, str]] = []
        reports: list[dict[str, object]] = []
        for part in discover_parts():
            voices, report = split_part(part)
            reports.append(report)
            if report["status"] != "PASS":
                write_results(all_voices, reports)
                return 1
            all_voices.extend(voices)
        write_results(all_voices, reports)
        return 0 if len(all_voices) == EXPECTED_TOTAL else 1

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
