import mongoose from "mongoose";

const accessLogSchema = new mongoose.Schema({
  profId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  timestamp: { type: Date, default: Date.now },
  granted: { type: Boolean, required: true }, // true for successful access, false for failed attempt
  reason: String, // e.g., "Code Verified", "Code generation failed", "Code expired"
  scheduleEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  // Temporary storage for verification codes (for audit purposes)
  verificationCode: { type: String, select: false }, 
  codeExpiresAt: { type: Date, select: false },
});

export default mongoose.model("AccessLog", accessLogSchema);
