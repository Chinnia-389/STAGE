import React from "react";

export default function AuthFooter({ mode, setMode }) {
  return (
    <div className="mt-6 text-center text-sm text-gray-600">
      {mode === "login" ? (
        <>
          Vous n'avez pas de compte ?{" "}
          <button
            className="text-black underline"
            onClick={() => setMode("register")}
            type="button"
          >
            S'inscrire
          </button>
        </>
      ) : (
        <>
          Vous avez déjà un compte ?{" "}
          <button
            className="text-black underline"
            onClick={() => setMode("login")}
            type="button"
          >
            Se connecter
          </button>
        </>
      )}
    </div>
  );
}
