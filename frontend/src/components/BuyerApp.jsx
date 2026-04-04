import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BuyerDashboard from './BuyerDashboard';

const BuyerApp = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<BuyerDashboard />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default BuyerApp;