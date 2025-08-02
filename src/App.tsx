import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SubmitClaim from './pages/SubmitClaim';
import ClaimsList from './pages/ClaimsList';
import ClaimDetails from './pages/ClaimDetails';
import Approvals from './pages/Approvals';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/submit-claim" element={<SubmitClaim />} />
            <Route path="/claims" element={<ClaimsList />} />
            <Route path="/claims/:id" element={<ClaimDetails />} />
            <Route path="/approvals" element={<Approvals />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
