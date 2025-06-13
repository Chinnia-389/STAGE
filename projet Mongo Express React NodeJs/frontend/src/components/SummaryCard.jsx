import React from 'react';

const SummaryCard = ({ title, value, comparison, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col justify-between items-start">
      <div className="text-gray-500 text-sm mb-2">{title}</div>
      <div className="flex items-center justify-between w-full">
        <div className="text-3xl font-semibold text-gray-800">{value}</div>
        {icon && <div className="text-gray-400 text-2xl">{icon}</div>} {/* Render icon if provided */}
      </div>
      {comparison && (
        <div className={`text-sm mt-2 ${comparison.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
          {comparison} vs mois précédent
        </div>
      )}
    </div>
  );
};

export default SummaryCard;