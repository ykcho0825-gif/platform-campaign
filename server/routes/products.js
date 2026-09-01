import { Router } from "express";
import { pool, SCHEMA } from "../db.js";
import { getMockProducts } from "../mockData.js";

const router = Router();
const num = (v) => Number(v || 0);
const rate = (a, b) => (num(b) > 0 ? num(a) / num(b) : 0);

router.get("/", async (_req, res, next) => {
  try {
    const r = await pool.query(`
      SELECT prod_nm,
             COUNT(*) AS campaign_count,
             SUM(cmpgn_svc_cnt) AS svc_cnt,
             SUM(copn_use_cnt) AS copn_use_cnt,
             SUM(toast_cmpgn_cnt) AS toast_pop,
             SUM(toast_show_cnt) AS toast_show,
             SUM(toast_click_cnt) AS toast_click,
             SUM(smart_cmpgn_cnt) AS smart_pop,
             SUM(smart_show_cnt) AS smart_show,
             SUM(smart_click_cnt) AS smart_click
      FROM ${SCHEMA}.yk_cmpgn_tmp_0730
      GROUP BY prod_nm
      ORDER BY SUM(cmpgn_svc_cnt) DESC NULLS LAST
    `);

    res.json(
      r.rows.map((row) => ({
        prodNm: row.prod_nm,
        campaignCount: num(row.campaign_count),
        svcCnt: num(row.svc_cnt),
        copnUseCnt: num(row.copn_use_cnt),
        toast: {
          showRate: rate(row.toast_show, row.toast_pop),
          clickRate: rate(row.toast_click, row.toast_show),
        },
        smart: {
          showRate: rate(row.smart_show, row.smart_pop),
          clickRate: rate(row.smart_click, row.smart_show),
        },
      }))
    );
  } catch (err) {
    console.warn("Falling back to mock product data:", err.message);
    res.json(getMockProducts());
  }
});

export default router;
