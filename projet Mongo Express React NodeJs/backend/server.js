import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Assurez-vous que ce module est bien installé (npm install dotenv)
import connectDB from './config/mongodb.js'; // Assurez-vous que le chemin est correct

// Importation des routes
import authRoutes from './routes/authRoutes.js';
import personsRoute from './routes/personsRoute.js';
import versementsRoutes from './routes/versements.js';

// Configuration de l'application Express
const app = express();
const port = process.env.PORT || 4000; // Utilise le port 4000 par défaut ou celui de l'environnement

// Middleware pour analyser le corps des requêtes JSON
app.use(express.json());

// Middleware CORS
// Permet à toutes les origines (*) de faire des requêtes (pour le développement)
app.use(cors({
  origin: '*',
  credentials: true // Important si vous gérez des sessions ou cookies (pas standard avec JWT)
}));

// Connexion à la base de données
// Utilisation d'une IIFE (Immediately Invoked Function Expression) pour gérer l'async/await
(async () => {
  try {
    await connectDB();
    console.log('MongoDB: Connexion à la base de données établie avec succès.');

    // Définition des endpoints API UNIQUEMENT après que la DB est connectée
    app.use('/api/auth', authRoutes);
    app.use('/api/persons', personsRoute);
    app.use('/api/versements', versementsRoutes);

    // Route de test de base
    app.get('/', (req, res) => {
      res.send("API Working");
    });

    // Démarrage du serveur
    app.listen(port, () => {
      console.log(`Serveur démarré sur le PORT : ${port}`);
      console.log(`Accès à l'API via : http://localhost:${port}/api`);
    });

  } catch (error) {
    console.error('ERREUR CRITIQUE: Échec de la connexion à la base de données ou du démarrage du serveur.', error);
    process.exit(1); // Arrête le processus Node.js en cas d'erreur critique
  }
})();
