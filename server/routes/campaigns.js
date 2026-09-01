import { Router } from "express";
import { pool, SCHEMA } from "../db.js";
import { getMockCampaign, getMockCampaigns } from "../mockData.js";

const router = Router();

const num = (v) => Number(v || 0);
const rate = (a, b) => (num(b) > 0 ? num(a) / num(b) : 0);

function shape(row) {
  return {
    cmpgnId: row.cmpgn_id,
    cmpgnNm: row.cmpgn_nm,
    prodNm: row.prod_nm,
    copnYn: row.copn_yn === 1,
    toastYn: row.toast_yn === 1,
    svcCnt: num(row.cmpgn_svc_cnt),
    copnUseCnt: num(row.copn_use_cnt),
    toast: {
      pop: num(row.toast_cmpgn_cnt),
      show: num(row.toast_show_cnt),
      click: num(row.toast_click_cnt),
      go: num(row.toast_go_cnt),
      exit: num(row.toast_exit_cnt),
      showRate: rate(row.toast_show_cnt, row.toast_cmpgn_cnt),
      clickRate: rate(row.toast_click_cnt, row.toast_show_cnt),
    },
    smart: {
      pop: num(row.smart_cmpgn_cnt),
      show: num(row.smart_show_cnt),
      click: num(row.smart_click_cnt),
      go: num(row.smart_go_cnt),
      exit: num(row.smart_exit_cnt),
      showRate: rate(row.smart_show_cnt, row.smart_cmpgn_cnt),
      clickRate: rate(row.smart_click_cnt, row.smart_show_cnt),
    },
  };
}

router.get("/", async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT cmpgn_id, cmpgn_nm, prod_nm, copn_yn, toast_yn, cmpgn_svc_cnt, copn_use_cnt,
              toast_cmpgn_cnt, toast_show_cnt, toast_click_cnt, toast_go_cnt, toast_exit_cnt,
              smart_cmpgn_cnt, smart_show_cnt, smart_click_cnt, smart_go_cnt, smart_exit_cnt
       FROM ${SCHEMA}.yk_cmpgn_tmp_0730
       ORDER BY cmpgn_svc_cnt DESC NULLS LAST`
    );
    res.json(r.rows.map(shape));
  } catch (err) {
    console.warn("Falling back to mock campaign list:", err.message);
    res.json(getMockCampaigns());
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT cmpgn_id, cmpgn_nm, prod_nm, copn_yn, toast_yn, cmpgn_svc_cnt, copn_use_cnt,
              toast_cmpgn_cnt, toast_show_cnt, toast_click_cnt, toast_go_cnt, toast_exit_cnt,
              smart_cmpgn_cnt, smart_show_cnt, smart_click_cnt, smart_go_cnt, smart_exit_cnt
       FROM ${SCHEMA}.yk_cmpgn_tmp_0730
       WHERE cmpgn_id = $1`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "not found" });
    res.json(shape(r.rows[0]));
  } catch (err) {
    console.warn("Falling back to mock campaign detail:", err.message);
    const campaign = getMockCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: "not found" });
    res.json(campaign);
  }
});

export default router;
