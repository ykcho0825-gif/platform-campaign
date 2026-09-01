import { Router } from "express";
import { pool, SCHEMA } from "../db.js";
import { getMockCoupons } from "../mockData.js";

const router = Router();
const num = (v) => Number(v || 0);
const rate = (a, b) => (num(b) > 0 ? num(a) / num(b) : 0);

router.get("/", async (_req, res, next) => {
  try {
    const r = await pool.query(`
      SELECT cmpgn_id, cmpgn_nm, copn_plcy_nm,
             SUM(copn_cnt) AS issued, SUM(copn_use_cnt) AS used
      FROM ${SCHEMA}.yk_cmpgn_copn_tmp_0730
      GROUP BY cmpgn_id, cmpgn_nm, copn_plcy_nm
      ORDER BY SUM(copn_cnt) DESC NULLS LAST
    `);
    res.json(
      r.rows.map((row) => ({
        cmpgnId: row.cmpgn_id,
        cmpgnNm: row.cmpgn_nm,
        copnPlcyNm: row.copn_plcy_nm,
        issued: num(row.issued),
        used: num(row.used),
        useRate: rate(row.used, row.issued),
      }))
    );
  } catch (err) {
    console.warn("Falling back to mock coupon data:", err.message);
    res.json(getMockCoupons());
  }
});

export default router;
