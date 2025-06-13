// backend/models/personsModel.js
import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cardNumber: {
        type: String,
        required: true,
        unique: true
    },
    address: { // New: Add address field
        type: String,
        required: false, // Optional, depending on your requirements
        default: ''
    },
    phoneNumber: { // New: Add phoneNumber field
        type: String,
        required: false, // Optional
        default: ''
    },
    initial: { // This field is already present from previous updates
        type: String,
        required: false,
    }
}, { timestamps: true });

export default mongoose.model('Person', personSchema);
