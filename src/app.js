import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Import des routes
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import accessLogRoutes from "./routes/accessLogRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/access-logs", accessLogRoutes);
app.use("/api/auth", authRoutes);

// Route test
app.get("/", (req, res) => {
  res.send("Serveur backend prêt !");
});

// Connexion MongoDB
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/classroomDB";

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connexion MongoDB réussie"))
  .catch((err) =>
    console.error("❌ Erreur de connexion MongoDB :", err)
  );

// Vérification et correction du PORT
let PORT = parseInt(process.env.PORT, 10);
if (isNaN(PORT) || PORT <= 0 || PORT >= 65536) {
  PORT = 3000;
}

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
