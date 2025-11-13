import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  profId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  dayOfWeek: { type: Number, required: true }, // 0 = dimanche, 1 = lundi, etc.
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

export default mongoose.model("Schedule", scheduleSchema);
