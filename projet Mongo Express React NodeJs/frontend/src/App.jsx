import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthPage from "./pages/AuthPage";
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';;// <-- importe le layout
import ProtectedRoute from "./components/ProtectedRoute"; // <-- importe le ProtecteRoute
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PersonsPage from './pages/PersonsPage';
import PersonDetailsPage from './pages/PersonDetailsPage';
import VersementsPage from './pages/VersementsPage';
import StatistiquesPage from './pages/StatistiquesPage';

export const backendUrl = import.meta.env.VITE_BACKEND_URL

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Pages publiques sans sidebar */}
        <Route path="/" element={<AuthPage modeDefault="login" />} />
        {/* Pages privées avec sidebar/layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personsPage"
          element={
            <ProtectedRoute>
              <Layout>
                <PersonsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/versementsPage"
          element={
            <ProtectedRoute>
              <Layout>
                <VersementsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistiquesPage"
          element={
            <ProtectedRoute>
              <Layout>
                <StatistiquesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* C'est la route cruciale pour les détails. Le ":id" est important ! */}
        <Route path="/persons/:id" element={<PersonDetailsPage />} />
      </Routes>
    </div>
  );
};

export default App;
