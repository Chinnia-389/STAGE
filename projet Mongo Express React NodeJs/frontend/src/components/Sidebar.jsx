import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LuLayoutDashboard, LuUsers, LuDollarSign, LuMoon, LuLogOut } from 'react-icons/lu';
import { BarChart } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Supprimer le token d'authentification (exemple)
    localStorage.removeItem('authToken'); // Remplacez 'authToken' par le nom de votre token

    // Vous pouvez également ajouter d'autres logiques de nettoyage si nécessaire,
    // comme réinitialiser l'état de l'utilisateur dans un contexte global.

    // 2. Rediriger l'utilisateur vers la page de connexion et remplacer l'entrée dans l'historique
    navigate('/', { replace: true }); // C'est ici que la magie opère !
  };

  return (
    <div className="w-64 bg-blue-200 shadow-lg p-6 flex flex-col justify-between">
      <div>
        {/* Logo/Title */}
        <div className="text-2xl font-bold text-gray-800 mb-8">
          Covenant Sowing
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <span className="w-8 h-8 rounded-full bg-blue-800 text-white flex items-center justify-center text-lg">A</span>
          <span>admin - Administrateur</span>
        </div>

        {/* Navigation */}
        <nav>
          <ul>
            <li className="mb-2">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold ${isActive ? 'bg-blue-50 text-blue-700' : ''}`
                }
              >
                <LuLayoutDashboard className="mr-3 text-lg" /> Tableau de bord
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/personsPage"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold ${isActive ? 'bg-blue-50 text-blue-700' : ''}`
                }
              >
                <LuUsers className="mr-3 text-lg" /> Personnes
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/versementsPage"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold ${isActive ? 'bg-blue-50 text-blue-700' : ''}`
                }
              >
                <LuDollarSign className="mr-3 text-lg" /> Versements
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/statistiquesPage"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold ${isActive ? 'bg-blue-50 text-blue-700' : ''}`
                }
              >
                <BarChart className="mr-3 text-lg" /> Statistiques
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>

      {/* Bottom Section */}
      <div>
        <button className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold mb-2 w-full text-left cursor-pointer">
          <LuMoon className="mr-3 text-lg" /> Mode sombre
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 font-semibold w-full text-left cursor-pointer"
        >
          <LuLogOut className="mr-3 text-lg" /> Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;