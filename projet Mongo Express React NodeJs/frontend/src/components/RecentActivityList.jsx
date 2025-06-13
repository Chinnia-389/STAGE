import React from 'react';

const RecentActivityList = ({ activities, formatAmount }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Activité récente</h2>
      <p className="text-gray-500 text-sm mb-4">Dernières transactions enregistrées</p>
      {activities && activities.length > 0 ? (
        <ul>
          {activities.map((activity) => (
            <li key={activity._id} className="flex items-center justify-between py-3 border-b last:border-b-0 border-gray-100">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-medium text-lg mr-4">
                  {/* Use personInitial if available, otherwise generate from personName */}
                  {activity.personInitial || (activity.personName ? activity.personName.charAt(0) : '')}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{activity.personName}</div>
                  <div className="text-sm text-gray-500">
                    {activity.date} &bull; Carte : {activity.numeroDeCompte}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">{formatAmount(activity.amount)}</div>
                <div className="text-sm text-gray-500">Transaction N°: {activity._id.slice(-6)}</div> {/* Use last 6 chars of ID for display */}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 py-10">
          Aucune activité récente trouvée.
        </div>
      )}
    </div>
  );
};

export default RecentActivityList;