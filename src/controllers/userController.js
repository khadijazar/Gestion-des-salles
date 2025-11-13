import User from "../models/User.js";
import bcrypt from "bcryptjs";

// GET /api/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash"); // ne pas envoyer le hash
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/users
export const createUser = async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Utilisateur déjà existant" });
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({ username, passwordHash, name, role });
    await newUser.save();

    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
