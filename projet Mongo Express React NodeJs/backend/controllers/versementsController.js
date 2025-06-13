// controllers/versementsController.js
import Versement from '../models/Versement.js'; // Utilisez la syntaxe import
import Person from '../models/personsModel.js'; // Importez le modèle Person

export const getAllVersements = async (req, res) => {
  try {
    const versements = await Versement.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: {
        versements: versements
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export const addVersement = async (req, res) => {
  const { date, personName, amount, numeroDeCompte, paymentType } = req.body;

  try {
    if (!date || !personName || !amount || !numeroDeCompte || !paymentType) {
        return res.status(400).json({ success: false, message: 'Veuillez remplir tous les champs.' });
    }

    const person = await Person.findOne({ name: personName });
    if (!person) {
        return res.status(404).json({ success: false, message: 'Personne non trouvée.' });
    }

    const newVersement = new Versement({
      date,
      personId: person._id,
      personName,
      personInitial: person.initial,
      amount: Number(amount),
      numeroDeCompte,
      paymentType
    });

    const savedVersement = await newVersement.save();
    res.status(201).json({ success: true, data: savedVersement });
  } catch (err) {
    console.error('Erreur lors de l\'ajout du versement:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'ajout du versement.' });
  }
};

export const updateVersement = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, personName, amount, numeroDeCompte, paymentType } = req.body;
        const updatedFields = { date, personName, amount, numeroDeCompte, paymentType };

        if (personName) {
            const person = await Person.findOne({ name: personName });
            if (!person) {
                return res.status(404).json({ success: false, message: 'Personne non trouvée.' });
            }
            updatedFields.personId = person._id;
            updatedFields.personInitial = person.initial;
        }

        const updatedVersement = await Versement.findByIdAndUpdate(id, updatedFields, {
            new: true,
            runValidators: true
        });

        if (!updatedVersement) {
            return res.status(404).json({ success: false, message: 'Versement non trouvé.' });
        }

        res.status(200).json({ success: true, data: updatedVersement });

    } catch (err) {
        console.error(`Erreur lors de la mise à jour du versement ${req.params.id}:`, err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'ID de versement invalide.' });
        }
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
};

export const deleteVersement = async (req, res) => {
    try {
        const versement = await Versement.findByIdAndDelete(req.params.id);

        if (!versement) {
            return res.status(404).json({ success: false, message: 'Versement non trouvé.' });
        }

        res.status(200).json({ success: true, message: 'Versement supprimé avec succès.' });
    } catch (err) {
        console.error(`Erreur lors de la suppression du versement ${req.params.id}:`, err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'ID de versement invalide.' });
        }
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
};
