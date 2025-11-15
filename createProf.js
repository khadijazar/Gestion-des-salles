import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js"; // make sure this path is correct

const MONGO_URI = "mongodb://localhost:27017/classroomDB";

mongoose.connect(MONGO_URI).then(async () => {
  console.log("Connecté à MongoDB...");

  const passwordHash = await bcrypt.hash("prof123", 10); // Set the professor's password here

  await User.create({
    username: "prof1@example.com", // email/username of the professor
    passwordHash,
    name: "Professeur Exemple",
    role: "professor",
  });

  console.log("Professeur créé avec succès !");
  process.exit();
}).catch(err => {
  console.error("Erreur de connexion à MongoDB:", err);
  process.exit(1);
});
