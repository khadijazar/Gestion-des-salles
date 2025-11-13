import mongoose from "mongoose";

const accessLogSchema = new mongoose.Schema({
  profId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  timestamp: { type: Date, default: Date.now },
  granted: { type: Boolean, required: true },
  reason: String,
  scheduleEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
});

export default mongoose.model("AccessLog", accessLogSchema);
