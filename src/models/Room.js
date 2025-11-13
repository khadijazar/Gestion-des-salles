import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: Number,
  location: String,
  features: [String],
});

export default mongoose.model("Room", roomSchema);
