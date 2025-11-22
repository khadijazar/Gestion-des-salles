import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
 profId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
 roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
 dayOfWeek: { type: Number, required: true }, // 0 = dimanche, 1 = lundi, etc.
 startTime: { type: Date, required: true },
 endTime: { type: Date, required: true },
 subject: { type: String, required: true },
 // 💡 Champ 'occupied' ajouté pour suivre l'état de la salle en temps réel
 occupied: { type: Boolean, default: false }, 
});

export default mongoose.model("Schedule", scheduleSchema);
