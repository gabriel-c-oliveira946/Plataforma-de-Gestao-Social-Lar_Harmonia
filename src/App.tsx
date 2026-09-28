/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import CadastrarAssistido from './pages/CadastrarAssistido';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <>
                  <Header />
                  <Dashboard />
                </>
              </ProtectedRoute>
            } />
            <Route path="/cadastrar" element={
              <ProtectedRoute>
                <>
                  <Header />
                  <CadastrarAssistido />
                </>
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
