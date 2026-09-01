import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import https from "node:https";
import path from "node:path";

const SHEET_ID = "1V1476ZgCyUd8q0DB-8rSp6mi_Q4PRHAwYbU8UoZEhSU";
const CALENDAR_GID = "0";
const OUTPUT_DIR = path.resolve(process.cwd(), "server/data/google-sheets");
const SNAPSHOT_PATH = path.join(OUTPUT_DIR, "calendar.gviz");
const METADATA_PATH = path.join(OUTPUT_DIR, "calendar-metadata.json");

function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: { "User-Agent": "campaign-dashboard-calendar-sync/1.0" },
      timeout: 30000,
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        if (redirects >= 5) return reject(new Error("Google redirect limit exceeded"));
        const nextUrl = new URL(response.headers.location, url);
        if (nextUrl.protocol !== "https:" || nextUrl.hostname !== "docs.google.com") {
          return reject(new Error("Google returned an unsupported redirect target"));
        }
        return resolve(download(nextUrl, redirects + 1));
      }
      if (response.statusCode !== 200) {
        response.resume();
        return reject(new Error(`Google Sheet returned HTTP ${response.statusCode}`));
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    request.on("timeout", () => request.destroy(new Error("Google Sheet request timed out")));
    request.on("error", reject);
  });
}

function parseAndValidate(text) {
  if (!text.includes("google.visualization.Query.setResponse")) {
    throw new Error("Google Visualization response was not returned");
  }
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  if (start < 0 || end <= start) throw new Error("Invalid Google Visualization response");
  const payload = JSON.parse(text.slice(start + 1, end));
  if (payload.status !== "ok" || !payload.table) throw new Error("Google Sheet response is not OK");
  const headers = (payload.table.cols || []).map((column) =>
    String(column.label || column.id || "").trim()
  );
  if (!headers.some((header) => header.includes("시작일"))) {
    throw new Error(`시작일 컬럼이 없습니다: ${headers.join(", ")}`);
  }
  const rowCount = (payload.table.rows || []).length;
  if (rowCount === 0) throw new Error("Calendar snapshot contains no rows");
  return { headers, rowCount };
}

async function atomicWrite(filePath, content) {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, filePath);
}

async function readExistingSnapshot() {
  try {
    return await readFile(SNAPSHOT_PATH, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
function normalizeLineEndings(value) {
  return value.replaceAll("\r\n", "\n");
}

async function main() {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`);
  url.searchParams.set("gid", CALENDAR_GID);
  url.searchParams.set("tqx", "out:json");
  url.searchParams.set("_", String(Date.now()));

  const text = await download(url);
  const validation = parseAndValidate(text);
  await mkdir(OUTPUT_DIR, { recursive: true });
  const existing = await readExistingSnapshot();
  if (existing !== null && normalizeLineEndings(existing) === normalizeLineEndings(text)) {
    console.log(`[calendar-sync] unchanged (${validation.rowCount} rows)`);
    return;
  }
  await atomicWrite(SNAPSHOT_PATH, text);
  await atomicWrite(METADATA_PATH, `${JSON.stringify({
    sheetId: SHEET_ID,
    gid: CALENDAR_GID,
    lastSuccessAt: new Date().toISOString(),
    rowCount: validation.rowCount,
    headers: validation.headers,
  }, null, 2)}\n`);
  console.log(`[calendar-sync] saved ${validation.rowCount} rows to ${SNAPSHOT_PATH}`);
}

main().catch((error) => {
  console.error(`[calendar-sync] failed: ${error.message}`);
  process.exitCode = 1;
});
