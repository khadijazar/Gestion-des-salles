import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";


// Fonction de connexion
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Vérifier si l’utilisateur existe
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Comparer les mots de passe
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "secret123", // ⚠️ À mettre dans .env ensuite
      { expiresIn: "1h" }
    );

    // Réponse au client
    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erreur de connexion :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
