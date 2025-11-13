import AccessLog from "../models/AccessLog.js";

// GET /api/accesslogs
export const getAccessLogs = async (req, res) => {
  try {
    const logs = await AccessLog.find()
      .populate("profId", "name")
      .populate("roomId", "name")
      .populate("scheduleEntryId");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/accesslogs
export const createAccessLog = async (req, res) => {
  try {
    const { profId, roomId, granted, reason, scheduleEntryId } = req.body;

    const log = new AccessLog({ profId, roomId, granted, reason, scheduleEntryId });
    await log.save();

    res.status(201).json({ message: "Accès enregistré" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
