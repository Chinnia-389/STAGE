import Person from '../models/personsModel.js';

// Créer une personne
export const createPerson = async (req, res) => {
  try {
    // Destructure les nouveaux champs: name, cardNumber, address, phoneNumber
    const { name, cardNumber, address, phoneNumber } = req.body;

    // Vérification des champs requis (name et cardNumber restent obligatoires)
    if (!name || !cardNumber) {
      return res.status(400).json({
        status: 'fail',
        message: 'Le nom et le numéro de carte sont requis.'
      });
    }

    // Génération robuste des initiales à partir du nom
    const initials = name
      .split(' ')
      .map(n => (n && n[0] ? n[0].toUpperCase() : ''))
      .join('');

    // Création de la nouvelle personne avec tous les champs
    const newPerson = await Person.create({
      name,
      cardNumber,
      initial: initials, // Inclut les initiales générées
      address: address || '', // Inclut l'adresse (ou une chaîne vide si non fournie)
      phoneNumber: phoneNumber || '' // Inclut le numéro de téléphone (ou une chaîne vide si non fourni)
    });

    res.status(201).json({
      status: 'success',
      data: {
        person: newPerson // Renvoie la personne créée
      }
    });
  } catch (err) {
    // Gestion de l'erreur de doublon sur cardNumber (code 11000)
    if (err.code === 11000 && err.keyPattern && err.keyPattern.cardNumber) {
      return res.status(400).json({
        status: 'fail',
        message: 'Ce numéro de carte existe déjà !'
      });
    }
    // Gestion d'autres erreurs
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Récupérer toutes les personnes
export const getAllPersons = async (req, res) => {
  try {
    const persons = await Person.find(); // Récupère toutes les personnes de la DB
    res.status(200).json({
      status: 'success',
      data: {
        persons: persons // Renvoie les personnes dans une clé 'persons' pour la cohérence
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Récupérer une personne par ID
export const getPerson = async (req, res) => {
  try {
    const person = await Person.findById(req.params.id); // Trouve la personne par ID
    if (!person) {
      return res.status(404).json({
        status: 'fail',
        message: 'Personne non trouvée' // Message si la personne n'existe pas
      });
    }
    res.status(200).json({
      status: 'success',
      data: {
        person: person // Renvoie la personne trouvée
      }
    });
  } catch (err) {
    console.error("Erreur lors de la récupération d'une personne :", err);
    // Gère l'erreur de CastError (ID invalide)
    if (err.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de personne invalide.'
      });
    }
    // Gère les autres erreurs serveur
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la récupération de la personne.'
    });
  }
};


// Mettre à jour une personne
export const updatePerson = async (req, res) => {
  try {
    // Déstructure les champs du corps de la requête
    const { name, cardNumber, address, phoneNumber } = req.body;
    // Crée un objet pour les champs à mettre à jour
    const updatedFields = { name, cardNumber, address, phoneNumber };

    // Si le nom est fourni dans la requête, régénère les initiales
    if (name) {
      updatedFields.initial = name
        .split(' ')
        .map(n => (n && n[0] ? n[0].toUpperCase() : ''))
        .join('');
    }

    // Trouve et met à jour la personne par ID
    const person = await Person.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true, // Renvoie le document mis à jour
      runValidators: true // Exécute les validateurs du schéma pour s'assurer que les données sont valides
    });

    if (!person) {
      return res.status(404).json({
        status: 'fail',
        message: 'Personne non trouvée' // Message si la personne n'existe pas
      });
    }
    res.status(200).json({
      status: 'success',
      data: {
        person: person // Renvoie la personne mise à jour
      }
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour d'une personne :", err);
    // Gère l'erreur de doublon sur cardNumber
    if (err.code === 11000 && err.keyPattern && err.keyPattern.cardNumber) {
      return res.status(400).json({
        status: 'fail',
        message: 'Ce numéro de carte existe déjà !'
      });
    }
    // Gère l'erreur de CastError (ID invalide)
    if (err.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de personne invalide.'
      });
    }
    // Gère les autres erreurs
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Supprimer une personne
export const deletePerson = async (req, res) => {
  try {
    const person = await Person.findByIdAndDelete(req.params.id); // Trouve et supprime la personne par ID
    if (!person) {
      return res.status(404).json({
        status: 'fail',
        message: 'Personne non trouvée' // Message si la personne n'existe pas
      });
    }
    res.status(204).json({ status: 'success', data: null }); // Réponse 204 No Content pour une suppression réussie
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};
