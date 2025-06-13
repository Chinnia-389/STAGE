import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LuDownload } from 'react-icons/lu';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:4000/api';

const PersonDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [personDetails, setPersonDetails] = useState(null);
  const [personVersements, setPersonVersements] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('Tous');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const tableRef = useRef(null);

  // Function to fetch person details and their payments from the API
  const fetchPersonData = async () => {
    setLoading(true);
    try {
      // 1. Fetch person details
      const personResponse = await fetch(`${API_BASE_URL}/persons/${id}`);
      if (!personResponse.ok) {
        // Attempt to parse and log the error message from the backend
        const errorData = await personResponse.json().catch(() => ({ message: 'No error message from server.' }));
        console.error(`HTTP Error for person details: ${personResponse.status}`, errorData);

        if (personResponse.status === 404) {
          toast.error(`Personne non trouvée ! Erreur: ${errorData.message || 'ID introuvable'}`);
          navigate('/personsPage');
          return;
        }
        throw new Error(`Erreur HTTP ! statut : ${personResponse.status} - ${errorData.message || 'Erreur inconnue.'}`);
      }
      const personData = await personResponse.json();
      setPersonDetails(personData.data.person); // Ensure this path is correct: personData.data.person

      // 2. Fetch all payments for this person (if necessary, ensure your backend has this endpoint)
      // NOTE: Your backend has `GET /api/versements` with date filters, but not specifically by person ID directly.
      // If `GET /api/versements/person/:id` does not exist, this call will fail.
      // For now, I will assume such an endpoint exists or you will implement it.
      // Alternatively, you can fetch all versements and filter them on the client-side,
      // but a dedicated backend endpoint is more efficient.
      const versementsResponse = await fetch(`${API_BASE_URL}/versements?personId=${id}`); // Assuming a filter by personId
      if (!versementsResponse.ok) {
        const errorData = await versementsResponse.json().catch(() => ({ message: 'No error message from server.' }));
        console.error(`HTTP Error for payments: ${versementsResponse.status}`, errorData);
        throw new Error(`Erreur HTTP ! statut : ${versementsResponse.status} - ${errorData.message || 'Erreur inconnue.'}`);
      }
      const versementsData = await versementsResponse.json();
      // Adjust based on actual versements response structure
      setPersonVersements(versementsData.data?.versements || []); 

    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la personne ou des versements :", error);
      toast.error(`Impossible de charger les détails de la personne. Erreur: ${error.message}. Veuillez réessayer.`);
      navigate('/personsPage');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and if ID changes
  useEffect(() => {
    fetchPersonData();
  }, [id, navigate]);

  // Calculate week bounds for a given date
  const getWeekBounds = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
  };

  // --- Updated useEffect block for filtering and calculating totals ---
  useEffect(() => {
    // Ensure totals are initialized to 0 if no payments exist
    if (!personVersements.length) {
      setFilteredHistory([]);
      setPersonDetails(prevDetails => {
        return prevDetails ? {
          ...prevDetails,
          weeklyTotal: formatAmount(0),
          monthlyTotal: formatAmount(0),
          yearlyTotal: formatAmount(0),
          generalTotal: formatAmount(0),
        } : null;
      });
      return; // Exit if no payments to process
    }

    let currentWeeklyTotal = 0;
    let currentMonthlyTotal = 0;
    let currentYearlyTotal = 0;
    let currentGeneralTotal = 0;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed month (0 for January)
    const { startOfWeek, endOfWeek } = getWeekBounds(today);

    // Iterate through ALL raw payments to calculate global totals
    personVersements.forEach(item => {
      // Ensure 'date' is in YYYY-MM-DD format
      const [year, month, day] = item.date.split('-').map(Number);
      // month - 1 because Date months are 0-indexed (January = 0)
      const itemDate = new Date(year, month - 1, day);

      const amount = parseFloat(item.amount); // amount is a string in Versement, so parseFloat is needed
      if (isNaN(amount)) {
        console.warn(`Invalid amount for payment ID ${item._id || 'unknown'}: ${item.amount}`);
        return; // Skip this payment if the amount is invalid
      }

      // Calculate totals based on ALL payments (before display filtering)
      currentGeneralTotal += amount;

      if (itemDate.getFullYear() === currentYear) {
        currentYearlyTotal += amount;
        if (itemDate.getMonth() === currentMonth) {
          currentMonthlyTotal += amount;
        }
      }
      if (itemDate >= startOfWeek && itemDate <= endOfWeek) {
        currentWeeklyTotal += amount;
      }
    });

    // Filtering for table display (based on filterPeriod)
    const tempFilteredHistory = personVersements.filter(item => {
      const [year, month, day] = item.date.split('-').map(Number);
      const itemDate = new Date(year, month - 1, day);

      if (filterPeriod === 'Cette semaine') {
        return itemDate >= startOfWeek && itemDate <= endOfWeek;
      } else if (filterPeriod === 'Ce mois') {
        return itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
      } else if (filterPeriod === 'Cette année') {
        return itemDate.getFullYear() === currentYear;
      }
      return true; // For 'Tous'
    });

    setFilteredHistory(tempFilteredHistory);

    // Update totals in personDetails for display
    setPersonDetails(prevDetails => {
      if (prevDetails) { // Ensure personDetails is not null
        return {
          ...prevDetails,
          weeklyTotal: formatAmount(currentWeeklyTotal),
          monthlyTotal: formatAmount(currentMonthlyTotal),
          yearlyTotal: formatAmount(currentYearlyTotal),
          generalTotal: formatAmount(currentGeneralTotal),
        };
      }
      return null; // Or handle initial state without details
    });

  }, [filterPeriod, personVersements]); // Important dependencies: filterPeriod and personVersements


  // Function to format the amount
  const formatAmount = (amount) => {
    if (typeof amount === 'number') {
      return `${amount.toLocaleString('fr-MG')} ariary`;
    }
    // If it's already a string and doesn't include 'ariary', add it.
    // This handles cases where the database returns a string without 'ariary' (less desirable)
    if (typeof amount === 'string' && !amount.includes('ariary')) {
      return `${amount} ariary`;
    }
    return amount; // Return the original if it's already a string with 'ariary' or another format
  };

  // --- CSV Download Function ---
  const handleDownloadCSV = () => {
    if (!filteredHistory || filteredHistory.length === 0) {
      toast.info("Aucune donnée à télécharger pour la période sélectionnée.");
      return;
    }

    const headers = ["Date", "Montant", "Numéro de Compte","paymentType"];
    const csvRows = [];

    csvRows.push(headers.join(';'));

    filteredHistory.forEach(item => {
      const date = `"${item.date}"`;
      const amount = `"${formatAmount(item.amount)}"`;
      const numeroDeCompte = `"${item.numeroDeCompte}"`;
      const paymentType = `"${item.paymentType}"`;
      csvRows.push([date, amount, numeroDeCompte,paymentType].join(';'));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historique_versements_${personDetails.name.replace(/\s+/g, '_')}_${filterPeriod}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Fichier CSV téléchargé avec succès !");
  };

  // --- PDF Download Function ---
  const handleDownloadPDF = async () => {
    if (!tableRef.current) {
      toast.error("Impossible de trouver le contenu à télécharger pour le PDF.");
      return;
    }
    if (!filteredHistory || filteredHistory.length === 0) {
      toast.info("Aucune donnée à télécharger pour la période sélectionnée.");
      return;
    }

    const input = tableRef.current;

    const options = {
      scale: 2,
      useCORS: true,
      logging: true,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
    };

    try {
      const canvas = await html2canvas(input, options);
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add document title and general information at the beginning of the PDF
      pdf.setFontSize(18);
      pdf.text(`Historique des versements de ${personDetails.name}`, 10, 20);
      pdf.setFontSize(12);
      pdf.text(`Numéro de compte : ${personDetails.cardNumber || 'N/A'}`, 10, 30);
      // New: Add Address and Phone Number to PDF
      pdf.text(`Adresse : ${personDetails.address || 'N/A'}`, 10, 38);
      pdf.text(`Téléphone : ${personDetails.phoneNumber || 'N/A'}`, 10, 46);
      pdf.text(`Période filtrée : ${filterPeriod}`, 10, 54);
      pdf.text(`Date de génération : ${new Date().toLocaleDateString('fr-FR')}`, 10, 62);


      const tableStartY = 70; // Adjusted start Y position to make space for new info
      pdf.addImage(imgData, 'PNG', 0, tableStartY, imgWidth, imgHeight);
      heightLeft -= (pageHeight - tableStartY);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`historique_versements_${personDetails.name.replace(/\s+/g, '_')}_${filterPeriod}.pdf`);
      toast.success("Fichier PDF généré avec succès !");
    } catch (error) {
      console.error("Error generating PDF:", error); // Log detailed error
      toast.error("Une erreur est survenue lors de la génération du PDF. Veuillez vérifier la console pour plus de détails.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-gray-600">
        Chargement des détails de la personne...
      </div>
    );
  }

  // Display a message if personDetails is null after loading
  if (!personDetails) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-gray-600">
        Impossible de charger les détails de cette personne.
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        {/* Header of details */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Détails de {personDetails.name}</h1>
          <button
            onClick={() => navigate('/personsPage')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
            Fermer
          </button>
        </div>

        {/* Person contact details */}
        <div className="mb-6 border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Informations de contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="text-gray-700">
              <span className="font-medium">Numéro de carte:</span> {personDetails.cardNumber || 'N/A'}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Adresse:</span> {personDetails.address || 'N/A'}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Téléphone:</span> {personDetails.phoneNumber || 'N/A'}
            </p>
          </div>
        </div>

        {/* Total summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
            <div className="text-sm font-medium text-gray-900">CETTE SEMAINE</div>
            <div className="text-xl font-semibold text-gray-800">{personDetails.weeklyTotal}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
            <div className="text-sm font-medium text-gray-900">CE MOIS</div>
            <div className="text-xl font-semibold text-gray-800">{personDetails.monthlyTotal}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
            <div className="text-sm font-medium text-gray-900">CETTE ANNÉE</div>
            <div className="text-xl font-semibold text-gray-800">{personDetails.yearlyTotal}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
            <div className="text-sm font-medium text-gray-900">TOTAL GÉNÉRAL</div>
            <div className="text-xl font-semibold text-gray-800">{personDetails.generalTotal}</div>
          </div>
        </div>

        {/* Period selector and download buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            {['Tous', 'Cette semaine', 'Ce mois', 'Cette année'].map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  filterPeriod === period
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            {/* Download CSV button */}
            <button
              onClick={handleDownloadCSV}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition duration-200"
              title="Télécharger l'historique en CSV"
            >
              <LuDownload className="text-xl" />
              <span>CSV</span>
            </button>
            {/* Download PDF button */}
            <button
              onClick={handleDownloadPDF}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition duration-200"
              title="Télécharger l'historique en PDF"
            >
              <LuDownload className="text-xl" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Payment history */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Historique des versements</h2>
        <div ref={tableRef} className="overflow-x-auto p-4 bg-white rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">DATE</th>
                <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">MONTANT</th>
                <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">NUMÉRO DE COMPTE</th>
                <th className="px-6 py-3 text-left text-1xl font-semibold text-gray-900 uppercase tracking-wider">TYPE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatAmount(item.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.numeroDeCompte}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.paymentType}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    Aucun versement trouvé pour cette période.
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

export default PersonDetailsPage;
