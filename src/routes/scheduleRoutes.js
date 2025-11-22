import express from "express";
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from "../controllers/scheduleController.js";
import { updateScheduleOccupation } from '../controllers/scheduleController.js';

const router = express.Router();

router.get("/", getSchedules);
router.post("/", createSchedule);
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);
router.put('/occupy/:id', updateScheduleOccupation);

export default router;
