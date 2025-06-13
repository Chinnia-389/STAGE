// backend/routes/versements.js
import express from 'express';
const router = express.Router();
import Versement from '../models/Versement.js';
import Person from '../models/personsModel.js'; // Chemin correct

// @route   GET /api/versements
// @desc    Récupère tous les versements, avec option de filtre par intervalle de dates
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Récupère les paramètres de requête
        let query = {}; // Initialise un objet de requête MongoDB

        if (startDate) {
            // Si une date de début est fournie, ajoute la condition $gte (greater than or equal)
            // Comme 'date' est un String 'YYYY-MM-DD', la comparaison de chaînes fonctionne ici.
            query.date = { ...query.date, $gte: startDate };
            console.log(`Filtre de date de début appliqué: ${startDate}`);
        }
        if (endDate) {
            // Si une date de fin est fournie, ajoute la condition $lte (less than or equal)
            // Pour 'YYYY-MM-DD', cela inclut la fin de cette journée.
            query.date = { ...query.date, $lte: endDate };
            console.log(`Filtre de date de fin appliqué: ${endDate}`);
        }

        const versements = await Versement.find(query).sort({ createdAt: -1 }); // Applique la requête
        res.status(200).json({ success: true, data: { versements } }); // Encapsule dans un objet avec 'success' et 'data'
    } catch (err) {
        console.error('Erreur lors de la récupération des versements:', err.message);
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
});

// @route   POST /api/versements
// @desc    Ajouter un nouveau versement
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { date, personName, amount, numeroDeCompte, paymentType } = req.body;

        // Vérification des champs requis
        if (!date || !personName || !amount || !numeroDeCompte || !paymentType) {
            return res.status(400).json({ success: false, message: 'Veuillez remplir tous les champs du versement.' });
        }

        // Trouver la personne par son nom pour obtenir l'ID et les initiales
        const person = await Person.findOne({ name: personName });
        if (!person) {
            return res.status(404).json({ success: false, message: 'Personne non trouvée pour le versement.' });
        }

        const newVersement = new Versement({
            date,
            personId: person._id, // Utilise l'ID de la personne trouvée
            personName,
            personInitial: person.initial, // Utilise les initiales de la personne trouvée
            amount: Number(amount), // Assurez-vous que le montant est un nombre
            numeroDeCompte,
            paymentType // Inclut le type de versement
        });

        const savedVersement = await newVersement.save();
        res.status(201).json({ success: true, data: savedVersement, message: 'Versement ajouté avec succès.' });
    } catch (err) {
        console.error('Erreur lors de l\'ajout du versement:', err.message);
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
});

// @route   PATCH /api/versements/:id
// @desc    Modifier un versement existant
// @access  Public
router.patch('/:id', async (req, res) => {
    try {
        const { date, personName, amount, numeroDeCompte, paymentType } = req.body;
        const updatedFields = { date, personName, amount, numeroDeCompte, paymentType };

        // Si le nom de la personne est modifié, mettez à jour personId et personInitial
        if (personName) {
            const person = await Person.findOne({ name: personName });
            if (!person) {
                return res.status(404).json({ success: false, message: 'Personne non trouvée pour la mise à jour du versement.' });
            }
            updatedFields.personId = person._id;
            updatedFields.personInitial = person.initial;
        }

        const versement = await Versement.findByIdAndUpdate(req.params.id, updatedFields, {
            new: true, // Retourne le document mis à jour
            runValidators: true, // Exécute les validateurs du schéma
        });

        if (!versement) {
            console.warn(`PATCH /api/versements/${req.params.id} - Versement non trouvé.`);
            return res.status(404).json({ success: false, message: 'Versement non trouvé.' });
        }

        console.log(`PATCH /api/versements/${req.params.id} - Versement modifié avec succès.`);
        res.status(200).json({ success: true, data: versement, message: 'Versement modifié avec succès.' });
    } catch (err) {
        console.error(`PATCH /api/versements/${req.params.id} - Erreur lors de la modification du versement :`, err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'ID de versement invalide.' });
        }
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
});

// @route   DELETE /api/versements/:id
// @desc    Supprimer un versement
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const versement = await Versement.findByIdAndDelete(req.params.id);

        if (!versement) {
            console.warn(`DELETE /api/versements/${req.params.id} - Versement non trouvé.`);
            return res.status(404).json({ success: false, message: 'Versement non trouvé.' });
        }

        console.log(`DELETE /api/versements/${req.params.id} - Versement supprimé avec succès.`);
        res.status(200).json({ success: true, message: 'Versement supprimé avec succès.' });
    } catch (err) {
        console.error(`DELETE /api/versements/${req.params.id} - Erreur lors de la suppression du versement :`, err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'ID de versement invalide.' });
        }
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
});

export default router;
