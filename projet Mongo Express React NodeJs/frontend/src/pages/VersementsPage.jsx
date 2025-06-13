import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';

// Importation des icônes Font Awesome (Fa)
import { FaPlus, FaTimes, FaEdit, FaTrash } from 'react-icons/fa'; // Importation des nouvelles icônes

const API_BASE_URL = 'http://localhost:4000/api'; // Base URL pour les APIs

const VersementsPage = () => {
  const [versements, setVersements] = useState([]);
  const [showForm, setShowForm] = useState(false); // Utilisé pour l'ajout et la modification
  const [newVersementData, setNewVersementData] = useState({
    date: '',
    person: '', // C'est le nom de la personne
    amount: '',
    numeroDeCompte: '', // C'est le numéro de carte de la personne
    paymentType: 'Ampafolokarena' // Nouvelle input d'option avec valeur par défaut
  });
  const [persons, setPersons] = useState([]);
  const [editingVersement, setEditingVersement] = useState(null); // Stocke le versement en cours de modification

  // États pour la recherche par date
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredVersements, setFilteredVersements] = useState([]); // Pour les versements après filtrage local

  // Exécute au montage du composant et lors de changements de date de filtre
  useEffect(() => {
    fetchVersements();
    fetchPersons();
  }, []);

  // Fonction de formatage des montants
  const formatAmount = (amount) => {
    if (typeof amount === 'number') {
      return `${amount.toLocaleString('fr-MG')} ariary`;
    }
    if (typeof amount === 'string' && !amount.includes('ariary')) {
      return `${amount} ariary`;
    }
    return amount;
  };

  // --- Fonctions d'appel API ---

  const fetchVersements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/versements`); // Récupère tous les versements
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No error message from server.' }));
        throw new Error(`Erreur HTTP ! statut : ${response.status} - ${errorData.message || 'Erreur inconnue.'}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data.versements)) {
        setVersements(result.data.versements);
        setFilteredVersements(result.data.versements); // Initialiser les versements filtrés avec tous les versements
      } else {
        setVersements([]);
        setFilteredVersements([]);
      }
    } catch (error) {
      toast.error(`Impossible de charger les versements. Erreur: ${error.message}.`);
    }
  };

  const fetchPersons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/persons`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No error message from server.' }));
        throw new Error(`Erreur HTTP ! statut : ${response.status} - ${errorData.message || 'Erreur inconnue.'}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setPersons(data);
      } else if (data.data && Array.isArray(data.data.persons)) { // Adapte à la structure de réponse du backend
        setPersons(data.data.persons);
      } else {
        setPersons(data.data || []);
      }
    } catch (error) {
      toast.warn(`La liste des personnes n'a pas pu être chargée. Erreur: ${error.message}.`);
    }
  };

  // --- Gestion du formulaire d'ajout/modification ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewVersementData(prevData => {
      let updatedData = { ...prevData, [name]: value };

      // Logique de remplissage automatique de numeroDeCompte lorsque le nom de la personne change
      if (name === 'person') {
        const selectedPerson = persons.find(p => p.name === value);
        if (selectedPerson) {
          updatedData.numeroDeCompte = selectedPerson.cardNumber;
        } else {
          updatedData.numeroDeCompte = ''; // Efface si aucune correspondance
        }
      }
      return updatedData;
    });
  };

  const handleOpenAddForm = () => {
    setEditingVersement(null); // S'assurer qu'on est en mode ajout
    setNewVersementData({ date: '', person: '', amount: '', numeroDeCompte: '', paymentType: 'Ampafolokarena' }); // Réinitialise avec le type de paiement par défaut
    setShowForm(true);
  };

  const handleOpenEditForm = (versement) => {
    setEditingVersement(versement); // Définit le versement à modifier
    setNewVersementData({
      date: versement.date,
      person: versement.personName,
      amount: versement.amount,
      numeroDeCompte: versement.numeroDeCompte,
      paymentType: versement.paymentType || 'Ampafolokarena' // Rempli le type de paiement ou par défaut
    });
    setShowForm(true);
  };

  const handleSubmitVersement = async (e) => {
    e.preventDefault();

    const { date, person, amount, numeroDeCompte, paymentType } = newVersementData;

    if (!date || !person || !amount || !numeroDeCompte || !paymentType) {
      toast.error("Veuillez remplir tous les champs du versement.");
      return;
    }

    try {
      let response;
      let method;
      let url;

      // Trouver la personne par son nom pour obtenir l'ID et les initiales pour le backend
      const selectedPerson = persons.find(p => p.name === person);
      if (!selectedPerson) {
        toast.error("Personne sélectionnée invalide. Veuillez choisir une personne de la liste.");
        return;
      }

      const bodyData = {
        date,
        personId: selectedPerson._id, // Passe personId au backend
        personName: person, // Backend attend 'personName'
        personInitial: selectedPerson.initial, // Passe initial au backend
        amount: Number(amount), // Assurez-vous que c'est un nombre
        numeroDeCompte,
        paymentType // Inclut le nouveau champ
      };

      if (editingVersement) {
        // Mode modification (PATCH)
        method = 'PATCH';
        url = `${API_BASE_URL}/versements/${editingVersement._id}`;
        response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });
      } else {
        // Mode ajout (POST)
        method = 'POST';
        url = `${API_BASE_URL}/versements`;
        response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || errorData.message || `Erreur ${method} du versement : ${response.statusText}`);
      }

      await fetchVersements(); // Re-récupère la liste mise à jour
      await fetchPersons(); // Re-récupère les personnes pour les totaux si nécessaire

      setNewVersementData({ date: '', person: '', amount: '', numeroDeCompte: '', paymentType: 'Ampafolokarena' });
      setEditingVersement(null);
      setShowForm(false);
      toast.success(`Versement ${editingVersement ? 'modifié' : 'ajouté'} avec succès !`);

    } catch (error) {
      toast.error(`Erreur lors de l'opération de versement : ${error.message}`);
    }
  };

  const handleDeleteVersement = async (id) => {
    toast.warn(
      <div>
        Êtes-vous sûr de vouloir supprimer ce versement ?
        <div className="mt-2 flex justify-end space-x-2">
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              try {
                const response = await fetch(`${API_BASE_URL}/versements/${id}`, {
                  method: "DELETE"
                });
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || `Erreur de suppression : ${response.statusText}`);
                }
                await fetchVersements(); // Re-récupère la liste
                await fetchPersons(); // Re-récupère les personnes pour les totaux
                toast.success("Versement supprimé avec succès !");
              } catch (error) {
                toast.error(`Erreur lors de la suppression du versement : ${error.message}`);
              } finally {
                toast.dismiss();
              }
            }}
          >
            Confirmer
          </button>
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
            onClick={() => toast.dismiss()}
          >
            Annuler
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        draggable: false,
        closeOnClick: false,
      }
    );
  };

  // --- Logique de recherche par date (Filtrage local) ---
  const handleSearchByDate = () => {
    if (!startDate && !endDate) {
      setFilteredVersements(versements); // Afficher tous les versements si pas de dates
      return;
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end && start > end) {
      toast.error("La date de début ne peut pas être postérieure à la date de fin.");
      return;
    }

    const tempFiltered = versements.filter(versement => {
      const versementDate = new Date(versement.date); // Assurez-vous que versement.date est valide

      if (start && versementDate < start) {
        return false;
      }
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (versementDate > endOfDay) {
          return false;
        }
      }
      return true;
    });
    setFilteredVersements(tempFiltered);
  };

  useEffect(() => {
    handleSearchByDate();
  }, [versements, startDate, endDate]);


  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* En-tête de la page */}
      <div className="flex justify-between items-center mb-6">
        <div className='mb-6'>
          <div className='flex items-center space-x-2 text-sm'>
            <img src={assets.logo} className="w-12 h-12 text-gray-400 rounded-full" alt="" />
            <h1 className="text-3xl font-bold text-gray-800">Gestion des versements</h1>
          </div>
          <p className="text-gray-600">Enregistrez et suivez toutes les transactions</p>
        </div>
        <button
          className="bg-blue-800 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition duration-200"
          onClick={handleOpenAddForm} // Appelle la nouvelle fonction
        >
          <FaPlus className="text-xl" />
          <span>Nouveau versement</span>
        </button>
      </div>

      {/* Barre de recherche par date */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Rechercher par date</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <input
            type="date"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Date de début"
          />
          <input
            type="date"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Date de fin"
          />
        </div>
        <button
          onClick={handleSearchByDate}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 w-full md:w-auto"
        >
          Rechercher
        </button>
        {(startDate || endDate) && ( // Afficher le bouton de réinitialisation si des dates sont définies
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 w-full md:w-auto"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Formulaire d'ajout/modification de versement (conditionnel) */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {editingVersement ? 'Modifier le versement' : 'Ajouter un nouveau versement'}
              </h2>
              <p className="text-gray-500 text-sm">
                {editingVersement ? 'Mettez à jour les détails de la transaction' : 'Entrez les détails de la transaction'}
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition duration-150"
              title="Annuler"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmitVersement}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  value={newVersementData.date}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="person" className="block text-sm font-medium text-gray-700 mb-2">
                  Personne
                </label>
                <input
                  type="text"
                  id="person"
                  name="person"
                  placeholder="Nom complet de la personne"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  value={newVersementData.person}
                  onChange={handleChange}
                  list="person-names" // Lie à la datalist pour l'autocomplétion
                />
                <datalist id="person-names">
                  {persons.map(p => (
                    <option key={p._id} value={p.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (ariary)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  placeholder="Ex: 250"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  value={newVersementData.amount}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="numeroDeCompte" className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de compte
                </label>
                <input
                  type="text"
                  id="numeroDeCompte"
                  name="numeroDeCompte"
                  placeholder="Numéro de compte"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  value={newVersementData.numeroDeCompte}
                  onChange={handleChange}
                  readOnly // Rend le champ en lecture seule car il est rempli automatiquement
                  title="Ce champ est rempli automatiquement après la sélection d'une personne."
                />
              </div>
              {/* Nouveau champ d'entrée: Type de Versement */}
              <div>
                <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-2">
                  Type de versement
                </label>
                <select
                  id="paymentType"
                  name="paymentType"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  value={newVersementData.paymentType}
                  onChange={handleChange}
                >
                  <option value="Ampafolokarena">Ampafolokarena</option>
                  <option value="Fanatitra Tsotra">Fanatitra Tsotra</option>
                  <option value="Sorona">Sorona</option>
                  <option value="Fanatitra Projet">Fanatitra Projet</option>
                  <option value="Hafa">Hafa</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-800 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
              >
                {editingVersement ? 'Modifier versement' : 'Ajouter versement'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewVersementData({ date: '', person: '', amount: '', numeroDeCompte: '', paymentType: 'Ampafolokarena' });
                  setEditingVersement(null);
                  setShowForm(false);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des versements */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Liste des versements</h2>
        <p className="text-gray-500 text-sm mb-6">{filteredVersements.length} transactions enregistrées</p>

        {/* Tableau des versements */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-800 uppercase tracking-wider">DATE</th>
                <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-800 uppercase tracking-wider">PERSONNE</th>
                <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-800 uppercase tracking-wider">MONTANT</th>
                <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-800 uppercase tracking-wider">TYPE</th> {/* Nouvelle colonne pour le type de paiement */}
                <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-800 uppercase tracking-wider">NUMÉRO DE COMPTE</th>
                <th className="px-6 py-3 text-center text-1xl font-semibold text-gray-800 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVersements.length > 0 ? (
                filteredVersements.map((versement) => (
                  <tr key={versement._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{versement.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold text-sm">
                            {versement.personInitial}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{versement.personName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatAmount(versement.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{versement.paymentType || 'N/A'}</td> {/* Affiche le type de paiement */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{versement.numeroDeCompte}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEditForm(versement)}
                          className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition duration-150"
                          title="Modifier le versement"
                        >
                          <FaEdit className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteVersement(versement._id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition duration-150"
                          title="Supprimer le versement"
                        >
                          <FaTrash className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Aucun versement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VersementsPage;
