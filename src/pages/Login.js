import React, { useState } from "react";
import "../styles/loginn.css";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur de connexion");
        return;
      }

      // Stockage du token + infos utilisateur
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirection selon le rôle
      if (data.user.role === "admin") navigate("/admin");
      else navigate("/prof");

    } catch (err) {
      console.error("Erreur :", err);
      setError("Impossible de contacter le serveur");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-left">
          <h1>ENPO Oran</h1>
          <p>Portail de gestion des salles et emplois du temps</p>
          <img
            src="https://cdn-icons-png.flaticon.com/512/2920/2920321.png"
            alt="Illustration"
            className="illustration"
          />
        </div>

        <div className="login-right">
          <h2>Connexion</h2>
          <form onSubmit={handleLogin}>
            <label>Nom d'utilisateur</label>
            <input
              type="text"
              placeholder="ex: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="error">{error}</p>}

            <button type="submit">Se connecter</button>
          </form>
        </div>
      </div>

      <footer>
        © 2025 École Nationale Polytechnique d’Oran — Tous droits réservés
      </footer>
    </div>
  );
};

export default Login;
