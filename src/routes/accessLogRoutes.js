import express from "express";
import { 
    getAccessLogs, 
    createAccessLog,
    generateVerificationCode,
    grantAccessAndOccupy
} from "../controllers/accessLogController.js";

const router = express.Router();

// GET /api/access-logs
router.get("/", getAccessLogs);

// POST /api/access-logs
router.post("/", createAccessLog);

// POST /api/access-logs/generate-code 🔑
router.post("/generate-code", generateVerificationCode);

// POST /api/access-logs/grant ✅
router.post("/grant", grantAccessAndOccupy);

export default router;