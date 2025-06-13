import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';

// Enregistrer les composants de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'http://localhost:4000/api'; // Base URL pour les APIs

const StatistiquesPage = () => {
  // State for fetched and calculated data
  const [statsData, setStatsData] = useState({
    thisWeek: '0 ariary',
    thisMonth: '0 ariary',
    thisYear: '0 ariary',
    totalGeneral: '0 ariary',
  });
  const [monthlyEvolutionData, setMonthlyEvolutionData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Versements (ariary)',
        data: [],
        fill: false,
        borderColor: 'rgb(59, 130, 246)', // Tailwind CSS blue-500/600
        tension: 0.1,
      },
    ],
  });
  const [topContributors, setTopContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fonction pour formater le montant (réutilisée des autres pages)
  const formatAmount = (amount) => {
    if (typeof amount === 'number') {
      return `${amount.toLocaleString('fr-MG')} ariary`;
    }
    if (typeof amount === 'string' && !amount.includes('ariary')) {
      return `${amount} ariary`;
    }
    return amount;
  };

  const fetchStatsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all persons
      const personsResponse = await fetch(`${API_BASE_URL}/persons`);
      if (!personsResponse.ok) {
        throw new Error(`HTTP error! status: ${personsResponse.status} for persons`);
      }
      const personsDataRaw = await personsResponse.json();
      let personsArray = [];
      if (Array.isArray(personsDataRaw)) {
        personsArray = personsDataRaw;
      } else if (personsDataRaw.data && Array.isArray(personsDataRaw.data)) {
        personsArray = personsDataRaw.data;
      } else if (personsDataRaw.data && personsDataRaw.data.persons) {
        personsArray = personsDataRaw.data.persons;
      }
      // Map persons to a more accessible object for quick lookup by ID
      const personsMap = new Map(personsArray.map(person => [person._id, person]));


      // 2. Fetch all versements
      const versementsResponse = await fetch(`${API_BASE_URL}/versements`);
      if (!versementsResponse.ok) {
        throw new Error(`HTTP error! status: ${versementsResponse.status} for versements`);
      }
      const versementsResult = await versementsResponse.json();
      let allVersements = [];
      if (versementsResult.success && Array.isArray(versementsResult.data.versements)) {
        allVersements = versementsResult.data.versements;
      }

      // --- Calculations ---
      let totalGeneralSum = 0;
      let thisWeekSum = 0;
      let thisMonthSum = 0;
      let thisYearSum = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed
      
      // Calculate start of current week (Monday)
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay(); // Sunday - 0, Monday - 1, etc.
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const monthlyTotals = {}; // { 'YYYY-MM': totalAmount }
      const contributorTotals = {}; // { personId: { total: amount, count: num, name: '', initial: '' } }

      allVersements.forEach(versement => {
        const amount = parseFloat(versement.amount);
        if (isNaN(amount)) {
          console.warn(`Invalid amount for versement ID ${versement._id || 'unknown'}: ${versement.amount}`);
          return;
        }

        const versementDate = new Date(versement.date);
        versementDate.setHours(0, 0, 0, 0); // Normalize to start of day

        // Total General
        totalGeneralSum += amount;

        // This Week
        if (versementDate >= startOfWeek && versementDate <= today) { // Inclusive of today
          thisWeekSum += amount;
        }

        // This Month & This Year
        if (versementDate.getFullYear() === currentYear) {
          thisYearSum += amount;
          if (versementDate.getMonth() === currentMonth) {
            thisMonthSum += amount;
          }
        }

        // For Monthly Evolution Chart
        const monthKey = `${versementDate.getFullYear()}-${(versementDate.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;

        // For Top Contributors
        if (!contributorTotals[versement.personId]) {
          const person = personsMap.get(versement.personId);
          contributorTotals[versement.personId] = {
            total: 0,
            count: 0,
            name: person ? person.name : 'Unknown',
            // Corrected: Fallback to generating initials from name if person.initial is not available
            initial: person ? (person.initial || (person.name ? person.name.split(' ').map(n => (n && n[0] ? n[0].toUpperCase() : '')).join('') : '?')) : '?',
          };
        }
        contributorTotals[versement.personId].total += amount;
        contributorTotals[versement.personId].count += 1;
      });

      // Prepare monthly chart data
      const sortedMonths = Object.keys(monthlyTotals).sort();
      const chartLabels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, parseInt(monthNum) - 1);
        return date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }); // e.g., "Jan 24"
      });
      const chartDataValues = sortedMonths.map(month => monthlyTotals[month]);

      setMonthlyEvolutionData({
        labels: chartLabels,
        datasets: [{
          label: 'Versements (ariary)',
          data: chartDataValues,
          fill: false,
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.1,
        }],
      });

      // Prepare top contributors data
      const sortedContributors = Object.values(contributorTotals)
        .sort((a, b) => b.total - a.total) // Sort by total amount descending
        .slice(0, 5); // Get top 5

      setStatsData({
        thisWeek: formatAmount(thisWeekSum),
        thisMonth: formatAmount(thisMonthSum),
        thisYear: formatAmount(thisYearSum),
        totalGeneral: formatAmount(totalGeneralSum),
      });

      setTopContributors(sortedContributors.map(contributor => ({
        ...contributor,
        totalVersements: formatAmount(contributor.total)
      })));

    } catch (error) {
      console.error("Error fetching statistics data:", error);
      toast.error(`Impossible de charger les statistiques. Erreur: ${error.message}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsData();
  }, []);

  // Options pour le graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow div to control height
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += formatAmount(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            // Adjust ticks dynamically based on max value
            const maxChartValue = Math.max(...monthlyEvolutionData.datasets[0].data, 0);
            if (maxChartValue === 0) return 0; // Handle no data
            const step = Math.ceil(maxChartValue / 4 / 100) * 100; // Round up to nearest 100 for clean steps
            
            if (value === 0 || value % step === 0) {
              return formatAmount(value);
            }
            return null;
          }
        }
      },
    },
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-gray-600">
        Chargement des statistiques...
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className='flex items-center space-x-2 text-sm'>
          <img src={assets.logo} className="w-12 h-12 text-gray-400 rounded-full" alt="" />
          <h1 className="text-3xl font-bold text-gray-800">Statistiques globales</h1>
        </div>
        <p className="text-gray-600">Analyse complète de vos données financières</p>
      </div>

      {/* Cartes de statistiques (Cette semaine, Ce mois, etc.) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm mb-2">CETTE SEMAINE</p>
          <h2 className="text-2xl font-bold text-gray-800">{statsData.thisWeek}</h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm mb-2">CE MOIS</p>
          <h2 className="text-2xl font-bold text-gray-800">{statsData.thisMonth}</h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm mb-2">CETTE ANNÉE</p>
          <h2 className="text-2xl font-bold text-gray-800">{statsData.thisYear}</h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-sm mb-2">TOTAL GÉNÉRAL</p>
          <h2 className="text-2xl font-bold text-gray-800">{statsData.totalGeneral}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle (Graphique) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Évolution mensuelle</h2>
          <p className="text-gray-500 text-sm mb-4">Tendance sur 6 mois</p>
          <div className="h-64"> {/* Hauteur fixe pour le graphique */}
            {monthlyEvolutionData.labels.length > 0 ? (
              <Line data={monthlyEvolutionData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Aucune donnée de versement disponible pour le graphique.
              </div>
            )}
          </div>
        </div>

        {/* Top contributeurs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top contributeurs</h2>
          <p className="text-gray-500 text-sm mb-4">Classement par montant total</p>
          
          <div className="space-y-4">
            {topContributors.length > 0 ? (
              topContributors.map((contributor, index) => (
                <div key={contributor.name + index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-sm">
                      {index + 1} {/* Rang */}
                    </span>
                    <div className="flex-shrink-0 h-9 w-9">
                      <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold text-sm">
                        {contributor.initial}
                      </div>
                    </div>
                    <span className="text-gray-800 font-medium">{contributor.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-800 font-semibold">{contributor.totalVersements}</p>
                    <p className="text-gray-500 text-xs">{contributor.count} versements</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-10">
                Aucun top contributeur trouvé.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatistiquesPage;
