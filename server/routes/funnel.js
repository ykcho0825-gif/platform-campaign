import { Router } from "express";
import { pool, SCHEMA } from "../db.js";
import { getMockFunnel } from "../mockData.js";

const router = Router();
const num = (v) => Number(v || 0);

router.get("/", async (req, res, next) => {
  try {
    const { cmpgnId, channel = "toast" } = req.query;
    const prefix = channel === "smart" ? "smart" : "toast";

    let row;
    if (cmpgnId) {
      const r = await pool.query(
        `SELECT ${prefix}_cmpgn_cnt AS pop, ${prefix}_show_cnt AS show, ${prefix}_click_cnt AS click,
                ${prefix}_go_cnt AS go, ${prefix}_exit_cnt AS exit
         FROM ${SCHEMA}.yk_cmpgn_tmp_0730 WHERE cmpgn_id = $1`,
        [cmpgnId]
      );
      row = r.rows[0];
    } else {
      const r = await pool.query(
        `SELECT SUM(${prefix}_cmpgn_cnt) AS pop, SUM(${prefix}_show_cnt) AS show, SUM(${prefix}_click_cnt) AS click,
                SUM(${prefix}_go_cnt) AS go, SUM(${prefix}_exit_cnt) AS exit
         FROM ${SCHEMA}.yk_cmpgn_tmp_0730`
      );
      row = r.rows[0];
    }

    if (!row) return res.status(404).json({ error: "not found" });

    res.json({
      channel: prefix,
      steps: [
        { stage: "모수", value: num(row.pop) },
        { stage: "노출", value: num(row.show) },
        { stage: "클릭", value: num(row.click) },
        { stage: "전환", value: num(row.go) },
      ],
      exit: num(row.exit),
    });
  } catch (err) {
    console.warn("Falling back to mock funnel data:", err.message);
    res.json(getMockFunnel(req.query.channel, req.query.cmpgnId));
  }
});

export default router;
