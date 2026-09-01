import { Router } from "express";
import { pool, SCHEMA } from "../db.js";
import { getMockSummary } from "../mockData.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const cmpgn = await pool.query(`
      SELECT
        COUNT(*) AS campaign_count,
        SUM(toast_cmpgn_cnt) AS toast_pop,
        SUM(toast_show_cnt) AS toast_show,
        SUM(toast_click_cnt) AS toast_click,
        SUM(toast_go_cnt) AS toast_go,
        SUM(toast_exit_cnt) AS toast_exit,
        SUM(smart_cmpgn_cnt) AS smart_pop,
        SUM(smart_show_cnt) AS smart_show,
        SUM(smart_click_cnt) AS smart_click,
        SUM(smart_go_cnt) AS smart_go,
        SUM(smart_exit_cnt) AS smart_exit
      FROM ${SCHEMA}.yk_cmpgn_tmp_0730
    `);

    const coupon = await pool.query(`
      SELECT SUM(copn_cnt) AS issued, SUM(copn_use_cnt) AS used
      FROM ${SCHEMA}.yk_cmpgn_copn_tmp_0730
    `);

    const c = cmpgn.rows[0];
    const cp = coupon.rows[0];

    const num = (v) => Number(v || 0);
    const rate = (a, b) => (num(b) > 0 ? num(a) / num(b) : 0);

    res.json({
      campaignCount: num(c.campaign_count),
      toast: {
        pop: num(c.toast_pop),
        show: num(c.toast_show),
        click: num(c.toast_click),
        go: num(c.toast_go),
        exit: num(c.toast_exit),
        showRate: rate(c.toast_show, c.toast_pop),
        clickRate: rate(c.toast_click, c.toast_show),
      },
      smart: {
        pop: num(c.smart_pop),
        show: num(c.smart_show),
        click: num(c.smart_click),
        go: num(c.smart_go),
        exit: num(c.smart_exit),
        showRate: rate(c.smart_show, c.smart_pop),
        clickRate: rate(c.smart_click, c.smart_show),
      },
      coupon: {
        issued: num(cp.issued),
        used: num(cp.used),
        useRate: rate(cp.used, cp.issued),
      },
    });
  } catch (err) {
    console.warn("Falling back to mock summary data:", err.message);
    res.json(getMockSummary());
  }
});

export default router;
