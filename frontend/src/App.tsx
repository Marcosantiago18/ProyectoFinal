import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contex/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VesselDetail from './pages/VesselDetail';
import SearchResults from './pages/SearchResults';
import MyBookings from './pages/MyBookings';

import { LanguageProvider } from './contex/LanguageContext';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            richColors
            theme="dark"
            toastOptions={{
              style: {
                background: '#1a2942',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vessel/:id" element={<VesselDetail />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/yachts" element={<SearchResults />} />
            <Route path="/jet-skis" element={<SearchResults />} />
            <Route path="/experiences" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;