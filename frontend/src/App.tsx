import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import Users from './pages/Users';
import Roles from './pages/Roles';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes Wrapper (Dashboard Layout) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
           <Route index element={<Overview />} />
           <Route path="setup/users" element={<Users />} />
           <Route path="setup/roles" element={<Roles />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
