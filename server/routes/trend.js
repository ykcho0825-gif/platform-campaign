import { Router } from "express";
import { pool, SCHEMA } from "../db.js";
import { getMockCohort, getMockTrend } from "../mockData.js";

const router = Router();
const num = (v) => Number(v || 0);

function linearForecast(points, horizon) {
  const n = points.length;
  if (n < 2) return [];
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.value);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num_ = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num_ += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num_ / den;
  const intercept = yMean - slope * xMean;

  const forecast = [];
  for (let i = 0; i < horizon; i++) {
    const x = n + i;
    forecast.push(Math.max(0, Math.round(intercept + slope * x)));
  }
  return forecast;
}

function addDays(dateStr, days) {
  const y = Number(dateStr.slice(0, 4));
  const m = Number(dateStr.slice(4, 6)) - 1;
  const d = Number(dateStr.slice(6, 8));
  const dt = new Date(Date.UTC(y, m, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

router.get("/calendar", async (req, res, next) => {
  try {
    const { channel = "TOAST", cmpgnId } = req.query;
    const params = [channel.toUpperCase()];
    let where = `cl = $1 AND pt_dt IS NOT NULL`;
    if (cmpgnId) {
      params.push(cmpgnId);
      where += ` AND cmpgn_id = $${params.length}`;
    }
    const r = await pool.query(
      `SELECT pt_dt, SUM(cnt) AS cnt
       FROM ${SCHEMA}.yk_popup_day_0803
       WHERE ${where}
       GROUP BY pt_dt
       ORDER BY pt_dt`,
      params
    );

    const points = r.rows.map((row) => ({ date: row.pt_dt, value: num(row.cnt) }));
    const horizon = 7;
    const forecastValues = linearForecast(points, horizon);
    const lastDate = points.length ? points[points.length - 1].date : null;
    const forecast = lastDate
      ? forecastValues.map((value, i) => ({ date: addDays(lastDate, i + 1), value }))
      : [];

    res.json({ actual: points, forecast });
  } catch (err) {
    console.warn("Falling back to mock calendar trend data:", err.message);
    res.json(getMockTrend("popup"));
  }
});

router.get("/cohort", async (req, res, next) => {
  try {
    const { type = "popup", cmpgnId } = req.query;
    const table = type === "coupon" ? "yk_cmpgn_copn_tmp_diff" : "yk_popup_day_diff";
    const valueCol = type === "coupon" ? "copn_use_cnt" : "cnt";

    const params = [];
    let where = `date_diff ~ '^[0-9]+$'`;
    if (cmpgnId) {
      params.push(cmpgnId);
      where += ` AND cmpgn_id = $${params.length}`;
    }

    const r = await pool.query(
      `SELECT date_diff::int AS day, SUM(${valueCol}) AS cnt
       FROM ${SCHEMA}.${table}
       WHERE ${where}
       GROUP BY date_diff::int
       ORDER BY day`,
      params
    );

    const total = r.rows.reduce((sum, row) => sum + num(row.cnt), 0);
    let cumulative = 0;
    const points = r.rows.map((row) => {
      cumulative += num(row.cnt);
      return {
        day: row.day,
        cnt: num(row.cnt),
        cumulativePct: total > 0 ? cumulative / total : 0,
      };
    });

    res.json({ type, points });
  } catch (err) {
    console.warn("Falling back to mock cohort data:", err.message);
    res.json(getMockCohort(req.query.type));
  }
});

export default router;
