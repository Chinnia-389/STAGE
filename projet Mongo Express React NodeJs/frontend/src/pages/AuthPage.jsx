import React, { useState } from 'react';
import axios from 'axios';
import AuthHeader from '../components/AuthHeader';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/auth/admin', {
        email,
        password,
      });
      if (res.data.success) {
        // Stocker le token JWT
        localStorage.setItem('jwt-token', res.data.token);
        // Rediriger ou afficher un message de succès
        window.location.href = '/dashboard'; // ou utilisez useNavigate de react-router
      } else {
        setError(res.data.message || 'Identifiants invalides');
      }
    } catch (err) {
      setError('Erreur serveur');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
         <AuthHeader/>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="exemple@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="text-red-500">{error}</div>}
          {/* Bouton principal */}
          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-2 rounded font-semibold mt-2 hover:bg-blue-950 transition disabled:opacity-60"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
