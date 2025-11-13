import express from "express";
import { createUser, getUsers } from "../controllers/userController.js";

const router = express.Router();

router.post("/", createUser);   // Créer utilisateur
router.get("/", getUsers);      // Lister tous les utilisateurs

export default router;
