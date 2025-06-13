// backend/models/Versement.js
import mongoose from 'mongoose';

const versementSchema = new mongoose.Schema({
    date: {
        type: String, // Conserver String si vos dates sont au format 'YYYY-MM-DD'
        required: true,
    },
    personId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person',
        required: true,
    },
    personName: {
        type: String,
        required: true,
    },
    personInitial: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    numeroDeCompte: {
        type: String,
        required: true,
    },
    paymentType: { // Nouveau: Champ pour le type de versement
        type: String,
        enum: ['Ampafolokarena', 'Fanatitra Tsotra', 'Sorona', 'Fanatitra Projet', 'Hafa'], // Définit les valeurs autorisées
        default: 'Ampafolokarena',
        required: true,
    },
}, {
    timestamps: true
});

export default mongoose.model('Versement', versementSchema);
