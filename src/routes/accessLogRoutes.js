import express from "express";
import { getAccessLogs, createAccessLog } from "../controllers/accessLogController.js";

const router = express.Router();

router.get("/", getAccessLogs);
router.post("/", createAccessLog);

export default router;
