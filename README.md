# Gestion‑des‑Salles — Backend

##  Description  
Le backend de **Gestion‑des‑Salles** fournit l’API serveur permettant de gérer les salles, les utilisateurs et les réservations.  
Il assure la logique métier, la communication avec la base de données, et expose des routes pour créer/modifier des salles, gérer les utilisateurs, traiter les réservations et consulter les plannings.  

##  Technologies & dépendances  
- Node.js  
- Express.js  
- MongoDB (via Mongoose)  
- (Autres selon ton projet : authentification, validation, etc.)  

##  Installation & démarrage  

### Prérequis  
- Node.js v22.14.0  
- Express.js  
- MongoDB (via Mongoose)  
- MongoDB Compass pour la gestion et visualisation de la base de données 

### Étapes  
```bash
git clone https://github.com/khadijazar/Gestion-des-salles.git
cd Gestion-des-salles
git checkout backend   # se positionner sur la branche backend
npm install            # installe les dépendances
cp .env.example .env   # (si tu utilises un .env)  
# puis configurer les variables d’environnement (URI MongoDB, port, etc.)
npm start              # ou la commande que tu as pour démarrer le serveur
