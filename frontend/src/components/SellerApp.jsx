import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SellerDashboard from './SellerDashboard';

const SellerApp = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<SellerDashboard />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default SellerApp;