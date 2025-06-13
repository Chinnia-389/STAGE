import React, { useState, useEffect } from 'react';
import { LuEye, LuPlus, LuX } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import {FaEye, FaTrash,FaPlus,FaTimes } from 'react-icons/fa';

const API_URL_PERSONS = "http://localhost:4000/api/persons";
const API_URL_VERSEMENTS = "http://localhost:4000/api/versements";

const PersonsPage = () => {
  const navigate = useNavigate();

  const [persons, setPersons] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonCardNumber, setNewPersonCardNumber] = useState('');
  // Add new state variables for address and phone number
  const [newPersonAddress, setNewPersonAddress] = useState('');
  const [newPersonPhoneNumber, setNewPersonPhoneNumber] = useState('');

  const [loading, setLoading] = useState(true);

  // Fonction pour formater le montant (réutilisée de PersonDetailsPage)
  const formatAmount = (amount) => {
    if (typeof amount === 'number') {
      return `${amount.toLocaleString('fr-MG')} ariary`;
    }
    if (typeof amount === 'string' && !amount.includes('ariary')) {
      return `${amount} ariary`;
    }
    return amount;
  };

  // Fonction pour calculer les totaux versés par personne
  const calculateTotalsForPersons = (personsData, versementsData) => {
    const personsWithTotals = personsData.map(person => {
      let totalVersed = 0;
      // Filtre les versements pour cette personne spécifique
      const personVersements = versementsData.filter(
        versement => versement.personId === person._id
      );

      // Somme les montants des versements
      personVersements.forEach(versement => {
        const amount = parseFloat(versement.amount);
        if (!isNaN(amount)) {
          totalVersed += amount;
        } else {
          console.warn(`Montant invalide pour le versement ID ${versement._id}: ${versement.amount}`);
        }
      });
      // Retourne la personne avec le total versé formaté
      return {
        ...person,
        totalVersed: formatAmount(totalVersed),
      };
    });
    return personsWithTotals;
  };

  // Fonction pour récupérer les personnes et les versements depuis l'API
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Récupérer les personnes
      const personsResponse = await fetch(API_URL_PERSONS);
      if (!personsResponse.ok) {
        throw new Error(`Erreur HTTP ! statut : ${personsResponse.status} lors de la récupération des personnes.`);
      }
      const personsDataRaw = await personsResponse.json();
      let personsArray = [];
      if (Array.isArray(personsDataRaw)) {
        personsArray = personsDataRaw;
      } else if (personsDataRaw.data && Array.isArray(personsDataRaw.data)) {
        personsArray = personsDataRaw.data;
      } else if (personsDataRaw.data && personsDataRaw.data.persons) {
        personsArray = personsDataRaw.data.persons;
      } else {
        console.warn("Format de réponse inattendu pour les personnes:", personsDataRaw);
      }


      // Récupérer les versements
      const versementsResponse = await fetch(API_URL_VERSEMENTS);
      if (!versementsResponse.ok) {
        throw new Error(`Erreur HTTP ! statut : ${versementsResponse.status} lors de la récupération des versements.`);
      }
      const versementsDataRaw = await versementsResponse.json();
      let versementsArray = [];
      // Assuming versementsDataRaw directly contains the array or a success object with data.versements
      if (Array.isArray(versementsDataRaw)) {
        versementsArray = versementsDataRaw;
      } else if (versementsDataRaw.success && Array.isArray(versementsDataRaw.data.versements)) {
        versementsArray = versementsDataRaw.data.versements;
      } else {
        console.warn("Format de réponse inattendu pour les versements:", versementsDataRaw);
      }


      // Calculer les totaux et mettre à jour l'état des personnes
      const personsWithCalculatedTotals = calculateTotalsForPersons(personsArray, versementsArray);
      setPersons(personsWithCalculatedTotals);

    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
      toast.error(`Impossible de charger les données. Erreur: ${error.message}.`);
    } finally {
      setLoading(false);
    }
  };

  // Charge la liste des personnes (avec totaux) et des versements au montage du composant
  useEffect(() => {
    fetchAllData();
  }, []); // Dépendances vides pour un seul appel au montage

  // Ajoute une personne via l'API
  const handleAddNewPerson = async (e) => {
    e.preventDefault();

    if (!newPersonName.trim() || !newPersonCardNumber.trim()) {
      toast.error("Le nom complet et le numéro de carte sont requis !");
      return;
    }

    try {
      const response = await fetch(API_URL_PERSONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPersonName.trim(),
          cardNumber: newPersonCardNumber.trim(),
          address: newPersonAddress.trim(), // Include address
          phoneNumber: newPersonPhoneNumber.trim(), // Include phone number
        }),
      });
      const result = await response.json();
      if (response.ok) {
        // Re-récupère toutes les données (personnes et versements) pour mettre à jour les totaux
        await fetchAllData();
        setNewPersonName('');
        setNewPersonCardNumber('');
        setNewPersonAddress(''); // Clear address
        setNewPersonPhoneNumber(''); // Clear phone number
        setShowAddForm(false);
        toast.success(`"${result.data.person.name}" a été ajouté(e) avec succès !`);
      } else {
        toast.error(result.message || "Erreur lors de l'ajout de la personne !");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la personne :", error);
      toast.error("Erreur de connexion au serveur lors de l'ajout de la personne !");
    }
  };

  // Fonction de suppression
  const handleDelete = async (id) => {
    toast.warn(
      <div>
        Êtes-vous sûr de vouloir supprimer cette personne ?
        <div className="mt-2 flex justify-end space-x-2">
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            onClick={async () => {
              try {
                const response = await fetch(`${API_URL_PERSONS}/${id}`, {
                  method: "DELETE"
                });
                if (response.ok) {
                  // Re-récupère toutes les données (personnes et versements) pour mettre à jour les totaux
                  await fetchAllData();
                  toast.success("Personne supprimée avec succès !");
                } else {
                  const errorData = await response.json();
                  toast.error(errorData.message || "Erreur lors de la suppression de la personne !");
                }
              } catch (error) {
                console.error("Erreur lors de la suppression de la personne :", error);
                toast.error("Erreur de connexion au serveur lors de la suppression de la personne !");
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

  // Voir les détails (navigation)
  const handleView = (id) => {
    navigate(`/persons/${id}`);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* En-tête de la page */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className='flex items-center space-x-2 text-sm'>
            <img src={assets.logo} className="w-12 h-12 text-gray-400 rounded-full" alt="" />
            <h1 className="text-3xl font-bold text-gray-800">Gestion des personnes</h1>
          </div>
          <p className="text-gray-600">Gérez votre base de contributeurs</p>
        </div>
        <button
          className="bg-blue-800 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition duration-200"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <FaPlus className="text-xl" /> {/* Icône FaPlus */}
          <span>Ajouter une personne</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Nouvelle personne</h2>
              <p className="text-gray-900 text-sm">Ajouter un nouveau contributeur au système</p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-900 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition duration-150"
              title="Annuler"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleAddNewPerson}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Use grid for 2 columns */}
              <div className="mb-4 md:mb-0"> {/* Remove bottom margin for md and above */}
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="Entrez le nom complet."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                />
              </div>

              <div className="mb-4 md:mb-0"> {/* Remove bottom margin for md and above */}
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de carte
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="Entrez le numéro de carte."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  value={newPersonCardNumber}
                  onChange={(e) => setNewPersonCardNumber(e.target.value)}
                />
              </div>

              {/* New: Address Input */}
              <div className="mb-4 md:mb-0"> {/* Remove bottom margin for md and above */}
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Entrez l'adresse."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  value={newPersonAddress}
                  onChange={(e) => setNewPersonAddress(e.target.value)}
                />
              </div>

              {/* New: Phone Number Input */}
              <div className="mb-6"> {/* Keep bottom margin for the last element in the grid */}
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="Entrez le numéro de téléphone."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  value={newPersonPhoneNumber}
                  onChange={(e) => setNewPersonPhoneNumber(e.target.value)}
                />
              </div>
            </div> {/* End of grid container */}

            <div className="flex space-x-3 mt-4"> {/* Added mt-4 for spacing from grid */}
              <button
                type="submit"
                className="bg-blue-800 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewPersonName('');
                  setNewPersonCardNumber('');
                  setNewPersonAddress(''); // Clear address on cancel
                  setNewPersonPhoneNumber(''); // Clear phone number on cancel
                  setShowAddForm(false);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Liste des personnes</h2>
        <p className="text-gray-500 text-sm mb-6">{persons.length} personnes enregistrées</p>

        {/* Tableau */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-4">Chargement...</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">NOM</th>
                  <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">TOTAL VERSÉ</th>
                  <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">NUMÉRO DE CARTE</th>
                    {/* New: Table Headers for Address and Phone Number */}
                  <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">ADRESSE</th>
                  <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">TÉLÉPHONE</th>
                  <th className="px-6 py-3 text-center text-1xl font-semibold text-gray-900 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {persons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">Aucune personne trouvée.</td> {/* Update colspan */}
                  </tr>
                ) : (
                  persons.map((person, idx) => (
                    <tr key={person._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center mr-3">
                            {person.initial ||
                              person.name
                                .split(' ')
                                .map((n) => n[0]?.toUpperCase())
                                .join('')
                            }
                          </div>
                          <div className="text-sm font-medium text-gray-900">{person.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person.totalVersed ?? formatAmount(0)} {/* Utilise le total calculé */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.cardNumber}</td>
                      {/* New: Table Data for Address and Phone Number */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.address || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.phoneNumber || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleView(person._id)}
                            className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition duration-150"
                            title="Voir les détails"
                          >
                              <FaEye className="text-lg" /> {/* Icône FaEye */}
                          </button>
                          <button
                            onClick={() =>  handleDelete(person._id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition duration-150"
                            title="Supprimer la personne"
                          >
                            <FaTrash className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonsPage;