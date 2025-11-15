import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";

const MONGO_URI = "mongodb://localhost:27017/classroomDB";

mongoose.connect(MONGO_URI).then(async () => {
  console.log("Connecté à MongoDB...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  await User.create({
    username: "admin",
    passwordHash,
    name: "Administrateur",
    role: "admin",
  });

  console.log("Admin créé avec succès !");
  process.exit();
});
