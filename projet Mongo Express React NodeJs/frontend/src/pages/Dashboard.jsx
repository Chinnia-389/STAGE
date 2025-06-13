import React, { useState, useEffect } from 'react';
import SummaryCard from '../components/SummaryCard';
import MonthlyEvolutionChart from '../components/MonthlyEvolutionChart';
import RecentActivityList from '../components/RecentActivityList';
import { LuWallet, LuUsers, LuTrendingUp } from 'react-icons/lu'; // Icons for summary cards
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:4000/api'; // Base URL for APIs

const Dashboard = () => {
  const [totalVersements, setTotalVersements] = useState('0 ariary');
  const [numberOfPersons, setNumberOfPersons] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to format amount (copied from PersonsPage.jsx/VersementsPage.jsx)
  const formatAmount = (amount) => {
    if (typeof amount === 'number') {
      return `${amount.toLocaleString('fr-MG')} ariary`;
    }
    if (typeof amount === 'string' && !amount.includes('ariary')) {
      return `${amount} ariary`;
    }
    return amount;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch persons data
      const personsResponse = await fetch(`${API_BASE_URL}/persons`);
      if (!personsResponse.ok) {
        throw new Error(`HTTP error! status: ${personsResponse.status} for persons`);
      }
      const personsData = await personsResponse.json();
      let personsArray = [];
      if (Array.isArray(personsData)) {
        personsArray = personsData;
      } else if (personsData.data && Array.isArray(personsData.data)) {
        personsArray = personsData.data;
      } else if (personsData.data && personsData.data.persons) {
        personsArray = personsData.data.persons;
      }
      setNumberOfPersons(personsArray.length); //

      // Fetch versements data
      const versementsResponse = await fetch(`${API_BASE_URL}/versements`);
      if (!versementsResponse.ok) {
        throw new Error(`HTTP error! status: ${versementsResponse.status} for versements`);
      }
      const versementsResult = await versementsResponse.json(); //
      let versementsArray = [];
      if (versementsResult.success && Array.isArray(versementsResult.data.versements)) { //
        versementsArray = versementsResult.data.versements; //
      }

      // Calculate total versements and total transactions
      let totalAmount = 0;
      const monthlyTotals = {}; // { 'YYYY-MM': totalAmount }

      versementsArray.forEach(versement => {
        const amount = parseFloat(versement.amount);
        if (!isNaN(amount)) {
          totalAmount += amount;
          
          // For Monthly Evolution Chart
          const [year, month] = versement.date.split('-');
          const monthKey = `${year}-${month}`;
          monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
        }
      });

      setTotalVersements(formatAmount(totalAmount));
      setTotalTransactions(versementsArray.length); // Total number of transactions

      // Prepare data for MonthlyEvolutionChart
      const sortedMonths = Object.keys(monthlyTotals).sort();
      const chartData = sortedMonths.map(month => ({
        month: month,
        total: monthlyTotals[month],
      }));
      setMonthlyData(chartData);

      // Prepare data for RecentActivityList (e.g., last 5 transactions)
      const sortedVersements = [...versementsArray].sort((a, b) => {
        // Assuming date is in 'YYYY-MM-DD' and createdAt is ISO string
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA; // Sort descending
      });
      setRecentActivities(sortedVersements.slice(0, 5)); // Get the 5 most recent activities

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error(`Failed to load dashboard data. Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className='flex items-center space-x-2 text-sm'>
          <img src={assets.logo} className="w-12 h-12 text-gray-400 rounded-full" alt="" />
          <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
        </div>
        <span className="text-gray-500 text-sm">Dernière mise à jour {new Date().toLocaleString()}</span>
      </div>
      <p className="text-gray-600 mb-8">Vue d'overview de votre activité financière</p>

      {loading ? (
        <div className="text-center text-gray-500">Loading dashboard data...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard
              title="TOTAL DES VERSEMENTS"
              value={totalVersements}
              comparison=""
              icon={<LuWallet />}
            />
            <SummaryCard
              title="NOMBRE DE PERSONNES"
              value={numberOfPersons}
              comparison=""
              icon={<LuUsers />}
            />
            <SummaryCard
              title="TOTAL DES TRANSACTIONS"
              value={totalTransactions}
              comparison=""
              icon={<LuTrendingUp />}
            />
          </div>

          {/* Chart and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyEvolutionChart data={monthlyData} />
            <RecentActivityList activities={recentActivities} formatAmount={formatAmount} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;