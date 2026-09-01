import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

import summaryRouter from "./routes/summary.js";
import campaignsRouter from "./routes/campaigns.js";
import couponsRouter from "./routes/coupons.js";
import funnelRouter from "./routes/funnel.js";
import trendRouter from "./routes/trend.js";
import crossRouter from "./routes/cross.js";
import productsRouter from "./routes/products.js";
import applicationsRouter from "./routes/applications.js";

const app = express();
const basePath = (process.env.BASE_PATH ?? `/${process.env.SERVICE_NAME || "campaign-dashboard0-v2-4"}`)
  .replace(/\/+$/, "");
const router = express.Router();
const distPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
app.use(cors());
app.use(express.json());
app.use(express.text({ type: "text/plain" }));
app.get("/health", (_req, res) => res.json({ status: "healthy", uptime: process.uptime() }));
app.get("/healthz", (_req, res) => res.json({ status: "healthy" }));
app.get("/ready", (_req, res) => res.json({ status: "ready" }));
app.get("/", (_req, res) => res.redirect(`${basePath}/`));

router.use("/api/summary", summaryRouter);
router.use("/api/campaigns", campaignsRouter);
router.use("/api/coupons", couponsRouter);
router.use("/api/funnel", funnelRouter);
router.use("/api/trend", trendRouter);
router.use("/api/cross", crossRouter);
router.use("/api/products", productsRouter);
router.use("/api/applications", applicationsRouter);

router.get("/health", (_req, res) => res.json({ status: "healthy", uptime: process.uptime() }));
router.get("/healthz", (_req, res) => res.json({ status: "healthy" }));
router.get("/ready", (_req, res) => res.json({ status: "ready" }));
router.use(express.static(distPath));
router.get("/{*splat}", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

app.use(basePath || "/", router);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = process.env.APP_PORT || process.env.PORT || 3000;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Campaign dashboard listening on port ${port} at ${basePath || "/"}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
