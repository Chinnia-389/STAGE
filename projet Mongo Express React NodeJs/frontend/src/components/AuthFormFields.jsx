import React from "react";

export default function AuthFormFields({ fields, handleChange }) {

  return (
    <>
      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          placeholder="exemple@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"
          required
        />
      </div>

      {/* Mot de passe */}
      <div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium mb-1">
            Mot de passe
          </label>
          <a href="#" className="text-xs text-gray-500 hover:underline">
            Mot de passe oublié ?
          </a>
        </div>
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"
          required
        />
      </div>
      {/* Bouton principal */}
      <button
        type="submit"
        className="w-full bg-blue-900 text-white py-2 rounded font-semibold mt-2 hover:bg-blue-950 transition disabled:opacity-60"
      >
        Se connecter

      </button>
    </>
  );
}
