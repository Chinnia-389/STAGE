import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MonthlyEvolutionChart = ({ data }) => {
  // Determine max value for Y-axis domain dynamically
  const maxValue = data.reduce((max, entry) => Math.max(max, entry.total), 0) * 1.1; // 10% buffer
  const minValue = data.length > 0 ? Math.min(...data.map(entry => entry.total)) * 0.9 : 0; // 10% buffer for min value, or 0 if no data

  // Format month names for display
  const formatMonthName = (dateString) => {
    const [year, month] = dateString.split('-');
    const date = new Date(year, month - 1); // Month is 0-indexed in Date object
    return date.toLocaleString('fr-FR', { month: 'short' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Évolution mensuelle</h2>
      <p className="text-gray-500 text-sm mb-4">Tendance des versements sur 6 mois</p>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatMonthName} // Format month names
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[minValue, maxValue]} // Dynamic domain
              tickFormatter={(value) => `${value.toLocaleString('fr-MG')}`} // Format amount
            />
            <Tooltip formatter={(value) => `${value.toLocaleString('fr-MG')} ariary`} />
            <Line type="monotone" dataKey="total" stroke="#efc050" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-gray-500 py-10">
          Aucune donnée de versement disponible pour le graphique.
        </div>
      )}
    </div>
  );
};

export default MonthlyEvolutionChart;