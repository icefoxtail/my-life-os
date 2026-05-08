#!/usr/bin/env node
/**
 * Typecast 게임 성우 mp3 일괄 생성기
 *
 * 실행 전 환경변수:
 *   TYPECAST_API_KEY=...
 *   TYPECAST_VOICE_ID=tc_...
 *
 * 선택 환경변수:
 *   TYPECAST_MODEL=ssfm-v30
 *   TYPECAST_LANGUAGE=kor
 *   TYPECAST_TEMPO=0.92
 *   TYPECAST_PITCH=0
 *   TYPECAST_VOLUME=100
 *   TYPECAST_EMOTION=smart
 *   FORCE=1                 이미 있는 mp3도 다시 생성
 *   DRY_RUN=1               실제 API 호출 없이 목록만 확인
 *
 * 실행:
 *   node scripts/generate-typecast-game-voices.js
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();
const VOICE_LINES_PATH = path.join(PROJECT_ROOT, "assets", "voice", "voice-lines.json");
const ENDPOINT = "https://api.typecast.ai/v1/text-to-speech";

const API_KEY = process.env.TYPECAST_API_KEY || "";
const VOICE_ID = process.env.TYPECAST_VOICE_ID || "";
const MODEL = process.env.TYPECAST_MODEL || "ssfm-v30";
const LANGUAGE = process.env.TYPECAST_LANGUAGE || "kor";
const AUDIO_FORMAT = "mp3";
const TEMPO = Number(process.env.TYPECAST_TEMPO || "0.92");
const PITCH = Number(process.env.TYPECAST_PITCH || "0");
const VOLUME = Number(process.env.TYPECAST_VOLUME || "100");
const EMOTION = process.env.TYPECAST_EMOTION || "smart";
const FORCE = process.env.FORCE === "1";
const DRY_RUN = process.env.DRY_RUN === "1";

function fail(message) {
  console.error(`\n[FAIL] ${message}\n`);
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) fail(`파일이 없습니다: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function validateLine(line, index) {
  if (!line || typeof line !== "object") fail(`voice-lines ${index}번 항목이 객체가 아닙니다.`);
  if (!line.id) fail(`voice-lines ${index}번 항목 id 없음`);
  if (!line.path) fail(`voice-lines ${index}번 항목 path 없음`);
  if (!line.text) fail(`voice-lines ${index}번 항목 text 없음`);
  if (String(line.text).length > 2000) fail(`${line.id} 텍스트가 2000자를 넘습니다.`);
  if (!String(line.path).endsWith(".mp3")) fail(`${line.id} path는 .mp3여야 합니다.`);
}

async function synthesize(line) {
  const body = {
    voice_id: VOICE_ID,
    text: line.text,
    model: MODEL,
    language: LANGUAGE,
    prompt: {
      emotion_type: EMOTION
    },
    output: {
      volume: VOLUME,
      audio_pitch: PITCH,
      audio_tempo: TEMPO,
      audio_format: AUDIO_FORMAT
    },
    seed: 42
  };

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY
    },
    body: JSON.stringify(body)
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch (_) {
      detail = "";
    }
    throw new Error(`HTTP ${response.status} ${response.statusText} ${detail}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (contentType.includes("application/json")) {
    const text = buffer.toString("utf8");
    throw new Error(`오디오가 아니라 JSON 응답이 왔습니다: ${text.slice(0, 500)}`);
  }

  if (buffer.length < 1000) {
    throw new Error(`오디오 파일 크기가 너무 작습니다: ${buffer.length} bytes`);
  }

  return buffer;
}

async function main() {
  if (!DRY_RUN) {
    if (!API_KEY) fail("TYPECAST_API_KEY 환경변수가 없습니다.");
    if (!VOICE_ID) fail("TYPECAST_VOICE_ID 환경변수가 없습니다.");
  }

  const data = readJson(VOICE_LINES_PATH);
  const lines = Array.isArray(data.lines) ? data.lines : [];
  if (!lines.length) fail("voice-lines.json에 lines 배열이 없습니다.");

  lines.forEach(validateLine);

  console.log(`[Typecast] voice lines: ${lines.length}`);
  console.log(`[Typecast] model=${MODEL}, language=${LANGUAGE}, tempo=${TEMPO}, emotion=${EMOTION}`);
  console.log(`[Typecast] force=${FORCE}, dryRun=${DRY_RUN}`);

  const failed = [];
  let created = 0;
  let skipped = 0;

  for (const line of lines) {
    const outPath = path.join(PROJECT_ROOT, line.path);

    if (!FORCE && fs.existsSync(outPath)) {
      skipped += 1;
      console.log(`[SKIP] ${line.id} -> ${line.path}`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`[DRY] ${line.id} -> ${line.path} :: ${line.text}`);
      continue;
    }

    try {
      console.log(`[MAKE] ${line.id} :: ${line.text}`);
      const audio = await synthesize(line);
      ensureParentDir(outPath);
      fs.writeFileSync(outPath, audio);
      created += 1;
      console.log(`[OK] ${line.path} (${audio.length} bytes)`);
      await sleep(350);
    } catch (error) {
      failed.push({ id: line.id, path: line.path, error: error.message });
      console.error(`[ERROR] ${line.id}: ${error.message}`);
      await sleep(700);
    }
  }

  console.log("\n[RESULT]");
  console.log(`created: ${created}`);
  console.log(`skipped: ${skipped}`);
  console.log(`failed : ${failed.length}`);

  if (failed.length) {
    console.log("\n[FAILED LIST]");
    failed.forEach((item) => {
      console.log(`- ${item.id} | ${item.path} | ${item.error}`);
    });
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
