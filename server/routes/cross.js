import { Router } from "express";
import { pool, SCHEMA } from "../db.js";
import { getMockCross } from "../mockData.js";

const router = Router();
const num = (v) => Number(v || 0);

router.get("/product-channel", async (_req, res, next) => {
  try {
    const r = await pool.query(`
      SELECT COALESCE(m.prod_nm, p.cnts_prod_id) AS product, p.cl AS channel, SUM(p.cnt) AS cnt
      FROM ${SCHEMA}.yk_popup_day_0803 p
      LEFT JOIN (
        SELECT DISTINCT ON (cnts_prod_id) cnts_prod_id, prod_nm
        FROM ${SCHEMA}.yk_cmpgn_tmp_0730
      ) m ON m.cnts_prod_id = p.cnts_prod_id
      GROUP BY product, channel
      ORDER BY product
    `);

    const products = {};
    for (const row of r.rows) {
      const key = row.product || "기타";
      products[key] = products[key] || { product: key, TOAST: 0, SMART: 0 };
      products[key][row.channel] = num(row.cnt);
    }
    res.json(Object.values(products));
  } catch (err) {
    console.warn("Falling back to mock product-channel data:", err.message);
    res.json(getMockCross("product-channel"));
  }
});

router.get("/campaign-dayband", async (_req, res, next) => {
  try {
    const top = await pool.query(`
      SELECT cmpgn_id, cmpgn_nm, SUM(cnt) AS total
      FROM ${SCHEMA}.yk_popup_day_diff
      WHERE date_diff ~ '^[0-9]+$'
      GROUP BY cmpgn_id, cmpgn_nm
      ORDER BY total DESC NULLS LAST
      LIMIT 20
    `);
    const ids = top.rows.map((r) => r.cmpgn_id);
    if (ids.length === 0) return res.json([]);

    const r = await pool.query(
      `SELECT cmpgn_id, cmpgn_nm,
              CASE
                WHEN date_diff::int = 0 THEN '0일'
                WHEN date_diff::int BETWEEN 1 AND 3 THEN '1-3일'
                WHEN date_diff::int BETWEEN 4 AND 7 THEN '4-7일'
                ELSE '8일+'
              END AS dayband,
              SUM(cnt) AS cnt
       FROM ${SCHEMA}.yk_popup_day_diff
       WHERE date_diff ~ '^[0-9]+$' AND cmpgn_id = ANY($1)
       GROUP BY cmpgn_id, cmpgn_nm, dayband`,
      [ids]
    );

    const bands = ["0일", "1-3일", "4-7일", "8일+"];
    const byCampaign = {};
    for (const id of ids) {
      const nm = top.rows.find((t) => t.cmpgn_id === id)?.cmpgn_nm;
      byCampaign[id] = { cmpgnId: id, cmpgnNm: nm, ...Object.fromEntries(bands.map((b) => [b, 0])) };
    }
    for (const row of r.rows) {
      byCampaign[row.cmpgn_id][row.dayband] = num(row.cnt);
    }
    res.json(Object.values(byCampaign));
  } catch (err) {
    console.warn("Falling back to mock campaign-dayband data:", err.message);
    res.json(getMockCross("campaign-dayband"));
  }
});

export default router;
