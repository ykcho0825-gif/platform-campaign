import { promises as fs } from "fs";
import path from "path";
import { Router } from "express";
import {
  createMockApplication,
  listMockApplications,
  searchMockCampaignCatalog,
} from "../mockData.js";
import { appendApplicationRow, getApplicationRows, syncConfirmedCalendar, updateExecution } from "../powerAutomateClient.js";

const router = Router();
const DATA_PATH = path.resolve(process.cwd(), "server/data/applications.json");
const CALENDAR_SHEET_GID = "0";
const APPLICATION_SHEET_GID = "1621616972";
const CALENDAR_SNAPSHOT_PATH = path.resolve(
  process.cwd(), "server/data/google-sheets/calendar.gviz"
);
const CALENDAR_METADATA_PATH = path.resolve(
  process.cwd(), "server/data/google-sheets/calendar-metadata.json"
);

async function readApplications() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      const fallback = listMockApplications();
      await writeApplications(fallback);
      return fallback;
    }
    throw error;
  }
}

async function writeApplications(applications) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(applications, null, 2)}\n`, "utf8");
}

function gvizCell(value) {
  const text = value == null ? "" : String(value);
  return text ? { v: text } : null;
}

function toGvizResponse(applications) {
  const cols = [
    ["cmpgnNm", "캠페인명"],
    ["startDate", "시작일"],
    ["endDate", "종료일"],
    ["channel", "채널"],
    ["category", "구분"],
    ["coupon", "쿠폰"],
    ["target", "타겟 수"],
    ["department", "부서"],
    ["owner", "담당자"],
    ["executionAt", "실행시각"],
  ];
  return {
    version: "0.6",
    status: "ok",
    table: {
      cols: cols.map(([id, label]) => ({ id, label, type: "string" })),
      rows: applications.map((item) => ({
        c: cols.map(([key]) => gvizCell(
          key === "target" ? (item.target ?? item.expectedVolume ?? 0) : item[key]
        )),
      })),
    },
  };
}

function toGvizFromRawRows(rows) {
  return {
    version: "0.6",
    status: "ok",
    table: {
      cols: Array.from({ length: 14 }, (_, i) => ({ id: `col${i}`, label: "", type: "string" })),
      rows: rows.map((row) => ({
        c: Array.from({ length: 14 }, (_, i) => gvizCell(row[i])),
      })),
    },
  };
}

router.get("/sheet/status", async (_req, res, next) => {
  try {
    const metadata = JSON.parse(await fs.readFile(CALENDAR_METADATA_PATH, "utf8"));
    return res.json({ source: "repository-snapshot", ...metadata });
  } catch (error) {
    next(error);
  }
});

router.get("/sheet", async (req, res, next) => {
  try {
    const gid = String(req.query.gid ?? CALENDAR_SHEET_GID);
    if (gid === CALENDAR_SHEET_GID) {
      const [body, metadata] = await Promise.all([
        fs.readFile(CALENDAR_SNAPSHOT_PATH, "utf8"),
        fs.readFile(CALENDAR_METADATA_PATH, "utf8").then(JSON.parse),
      ]);
      res.set({
        "Cache-Control": "no-store",
        "X-Sheet-Gid": CALENDAR_SHEET_GID,
        "X-Sheet-Data-Source": "repository-snapshot",
        "X-Sheet-Last-Sync": metadata.lastSuccessAt,
      });
      return res.type("application/json").send(body);
    }
    if (gid !== APPLICATION_SHEET_GID) {
      return res.status(400).json({ error: `unsupported sheet gid: ${gid}` });
    }
    let payload;
    const source = "excel-live";
    try {
      const liveRows = await getApplicationRows();
      payload = toGvizFromRawRows(liveRows);
    } catch (error) {
      console.error("신청 시트(Excel) 실시간 조회 실패:", error);
      return res.status(502).json({
        error: "OneDrive Excel 신청목록을 불러오지 못했습니다. POWER_AUTOMATE_WEBHOOK_URL Secret과 Power Automate 플로우를 확인해 주세요.",
      });
    }
    res.set({
      "Cache-Control": "no-store",
      "X-Sheet-Gid": APPLICATION_SHEET_GID,
      "X-Sheet-Data-Source": source,
    });
    return res.type("application/json").send(
      `google.visualization.Query.setResponse(${JSON.stringify(payload)});`
    );
  } catch (error) {
    next(error);
  }
});

router.post("/sheet", async (req, res, next) => {
  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (payload.action !== "updateExecution") {
      // 담당자 모드 목록은 A~I(9개 열)가 전부 채워진 행만 노출하므로(loadSheetRows의
      // hasRequiredValues), 여기서도 그 9개를 그대로 필수값으로 맞춰 빈 값으로 저장된 뒤
      // 목록에 영영 안 뜨는 사고를 막는다.
      const requiredFields = [
        "cmpgnNm", "startDate", "endDate", "channel", "category", "coupon", "target", "department", "owner",
      ];
      const missing = requiredFields.find((field) => !payload[field]);
      if (missing) {
        return res.status(400).json({ error: `${missing}은(는) 필수입니다.` });
      }
      try {
        await appendApplicationRow(payload);
      } catch (error) {
        console.error("신청 시트(Excel) 적재 실패:", error);
        return res.status(502).json({ error: "신청 시트(Excel)에 캠페인 신청을 저장하지 못했습니다." });
      }
      return res.json({ ok: true, persistedBy: "/api/applications" });
    }

    const applicationKey = String(payload.applicationKey || "");
    if (!applicationKey || !payload.executionAt) {
      return res.status(400).json({ error: "신청 고유키와 실행시각이 필요합니다." });
    }
    try {
      await updateExecution(applicationKey, String(payload.executionAt));
    } catch (error) {
      console.error("실행시각 저장 실패:", error);
      return res.status(502).json({ error: "신청 시트(Excel)에 실행시각을 저장하지 못했습니다." });
    }

    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
router.post("/sheet/sync-confirmed", async (_req, res, next) => {
  try {
    const count = await syncConfirmedCalendar();
    return res.json({ ok: true, count });
  } catch (error) {
    console.error("'확정' 탭 동기화 실패:", error);
    return res.status(502).json({ error: "'확정' 탭 동기화에 실패했습니다." });
  }
});

router.get("/search", (req, res) => {
  const owner = String(req.query.owner || "");
  const campaignName = String(req.query.campaignName || "");
  res.json(searchMockCampaignCatalog({ owner, campaignName }));
});

router.get("/", async (_req, res, next) => {
  try {
    res.json(await readApplications());
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const requiredFields = ["cmpgnId", "cmpgnNm", "owner", "channel", "startDate", "endDate"];
    const missing = requiredFields.find((field) => !req.body?.[field]);
    if (missing) {
      return res.status(400).json({ error: `${missing} is required` });
    }

    const applications = await readApplications();
    const application = createMockApplication(req.body);
    const persisted = [application, ...applications];
    await writeApplications(persisted);
    return res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

export default router;
